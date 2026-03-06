import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { user, activityLogin, customer, customerAlamat } from "@/lib/db/schema";
import { eq, like, and, notLike, desc, sql } from "drizzle-orm";
import { login } from "@/lib/auth-utils";
import { randomBytes } from "crypto";
import { execSync } from "child_process";
import { sendActivationEmail } from "@/lib/mail";
import logger, { apiLogger } from "@/lib/logger";

function buatkode(lastId: string, key: string, padding: number) {
    const lastNum = parseInt(lastId.substring(key.length)) || 0;
    const nextNum = lastNum + 1;
    const nextId = key + nextNum.toString().padStart(padding, "0");
    return nextId;
}

async function getNextCustId() {
    const lastCustomer = await db.select({ custId: customer.custId })
        .from(customer)
        .where(
            and(
                like(customer.custId, 'C%'),
                notLike(customer.custId, 'CUST-%')
            )
        )
        .orderBy(desc(customer.custId))
        .limit(1);

    const key = "C";
    const padding = 10;
    const lastId = lastCustomer.length > 0 ? lastCustomer[0].custId : `${key}${"0".repeat(padding)}`;

    return buatkode(lastId, key, padding);
}

/**
 * Login/Register via Google OAuth.
 * Memverifikasi ID token Google, membuat akun baru jika belum ada,
 * atau login jika user sudah terdaftar.
 *
 * @auth none
 * @method POST
 * @body {{ credential: string }} (Google ID Token)
 * @response 200 — { success: true }
 * @response 302 — Redirect ke homepage (jika Google Redirect Mode)
 * @response 400 — { error: "Credential is required" }
 * @response 401 — { error: "Invalid Google token" }
 * @response 500 — { error: "Internal server error" }
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let credential = "";
        let isRedirect = false;

        if (contentType.includes("application/json")) {
            const body = await request.json();
            credential = body.credential || body.id_token;
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            credential = (formData.get("credential") as string) || (formData.get("id_token") as string);
            isRedirect = true;
        }

        if (!credential) {
            return NextResponse.json({ error: "Credential is required" }, { status: 400 });
        }

        // Verify the ID token with Google
        // For production, using google-auth-library is recommended, 
        // but for now we use the public tokeninfo endpoint.
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const payload = await verifyRes.json();

        if (!verifyRes.ok || payload.error) {
            logger.error("Auth Error: Google token verification failed", { error: payload.error_description || payload.error });
            return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
        }

        const { email, name, picture, sub: googleId } = payload;
        const trimmedEmail = email.toLowerCase();

        logger.info("Auth Request: Google login attempt", { email: trimmedEmail });

        // Check if user exists
        let userData = await db.select().from(user).where(eq(user.email, trimmedEmail)).limit(1);
        let currentUser;

        if (userData.length === 0) {
            // Create new user
            logger.info("Auth Info: Creating new user via Google", { email: trimmedEmail });

            const now = Math.floor(Date.now() / 1000);
            const authKey = randomBytes(16).toString("hex");
            const tempPassword = randomBytes(16).toString("hex");

            const verificationToken = randomBytes(32).toString("hex");

            // Hash temp password via PHP for parity
            const b64Password = Buffer.from(tempPassword).toString('base64');
            const phpCmd = `php -r 'echo password_hash(base64_decode("${b64Password}"), PASSWORD_BCRYPT, ["cost" => 13]);'`;
            let passwordHash = "";
            try {
                passwordHash = execSync(phpCmd).toString().trim();
            } catch (e: any) {
                logger.error("Auth Error: Google registration PHP hash failure", { error: e.message });
                passwordHash = "GOOGLE_OAUTH_USER"; // Fallback if PHP fails (though unlikely)
            }

            await db.transaction(async (tx) => {
                const [userResult]: any = await tx.insert(user).values({
                    username: trimmedEmail,
                    email: trimmedEmail,
                    passwordHash: passwordHash,
                    authKey: authKey,
                    nama: name || "Google User",
                    role: 2, // Customer
                    status: 10, // Active
                    isDeleted: 2, // Pending verification
                    verificationToken: verificationToken,
                    createdAt: now,
                    updatedAt: now,
                    alamat: "",
                    photo: picture || "",
                    urlphoto: picture || "",
                    updatephoto: "",
                });

                const insertedUserId = userResult.insertId;
                const custId = await getNextCustId();

                await tx.insert(customer).values({
                    custId: custId,
                    namaCustomer: name || "Google User",
                    userId: insertedUserId,
                    email: trimmedEmail,
                    telp: "",
                    alamat: "",
                    alamatLengkap: "",
                    namaToko: "",
                    kecamatan: "",
                    kota: "",
                    provinsi: "",
                    kodepos: "",
                    kategoriCustomerId: 4, // Default to Pelanggan
                    completedDepositTime: sql`CURRENT_TIMESTAMP`,
                    isDeleted: 0,
                });

                await tx.insert(customerAlamat).values({
                    custId: custId,
                    labelAlamat: "Utama",
                    namaPenerima: name || "Google User",
                    alamatLengkap: "",
                    noHandphone: "",
                    kecamatan: "",
                    kota: "",
                    provinsi: "",
                    kodePos: "",
                    isPrimary: 1,
                    createdAt: sql`CURRENT_TIMESTAMP`,
                    createdBy: insertedUserId,
                });
            });

            // Re-fetch the newly created user to get the full record (especially the ID)
            const newUserRes = await db.select().from(user).where(eq(user.email, trimmedEmail)).limit(1);
            currentUser = newUserRes[0];

            const activationLink = `${process.env.NEXT_PUBLIC_URL}/verify-email?token=${verificationToken}`;
            after(async () => {
                logger.info("Background job: Sending activation email for Google Registration", { email: trimmedEmail });
                await sendActivationEmail(trimmedEmail, activationLink);
            });

            if (isRedirect) {
                return NextResponse.redirect(new URL("/login?registered=true", process.env.NEXT_PUBLIC_URL!));
            }

            return NextResponse.json({
                success: true,
                requiresVerification: true,
                message: "Registrasi berhasil. Silakan cek email Anda untuk aktivasi akun."
            });

        } else {
            currentUser = userData[0];

            // If user was previously unverified (isDeleted: 2), verify them now since Google verified their email
            if (currentUser.isDeleted === 2) {
                await db.update(user)
                    .set({ isDeleted: 1, status: 10 })
                    .where(eq(user.id, currentUser.id));
                currentUser.isDeleted = 1;
            }
        }

        // Register login activity
        await db.insert(activityLogin).values({
            createdBy: currentUser.id,
            device: "web",
        });

        // Establish session
        await login({
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.nama,
        });

        logger.info("Auth Success: Google login successful", { email: trimmedEmail, userId: currentUser.id });

        if (isRedirect) {
            // Redirect to home page if using Google's Redirect Mode
            return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_URL!));
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
