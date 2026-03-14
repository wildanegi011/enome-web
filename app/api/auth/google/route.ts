import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { user, activityLogin, customer, customerAlamat } from "@/lib/db/schema";
import { eq, like, and, notLike, desc, sql } from "drizzle-orm";
import { login } from "@/lib/auth-utils";
import { randomBytes } from "crypto";
import { execSync } from "child_process";
import { sendActivationEmail } from "@/lib/mail";
import { getJakartaDate } from "@/lib/date-utils";
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
        let stateParam = "";
        let isRedirect = false;

        if (contentType.includes("application/json")) {
            const body = await request.json();
            credential = body.credential || body.id_token;
            stateParam = body.state || "";
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            credential = (formData.get("credential") as string) || (formData.get("id_token") as string);
            stateParam = (formData.get("state") as string) || "";
            isRedirect = true;
        }

        if (!credential) {
            return NextResponse.json({ error: "Credential is required" }, { status: 400 });
        }

        // Verify the ID token with Google
        logger.info("Auth Info: Verifying Google token", { credentialLength: credential?.length });

        let verifyRes;
        try {
            verifyRes = await fetch("https://oauth2.googleapis.com/tokeninfo", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ id_token: credential }).toString(),
            });
        } catch (fetchErr: any) {
            logger.error("Auth Error: Google fetch exception", {
                message: fetchErr.message,
                stack: fetchErr.stack,
                cause: fetchErr.cause
            });
            return NextResponse.json({ error: "Gagal terhubung ke layanan verifikasi Google" }, { status: 500 });
        }

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

            // Check for orphaned customer record
            const existingCustomers = await db.select().from(customer).where(eq(customer.email, trimmedEmail)).limit(1);
            let inheritedCustomer = null;

            if (existingCustomers.length > 0) {
                const linkedUserId = existingCustomers[0].userId;
                let isOrphaned = !linkedUserId;

                if (linkedUserId) {
                    const linkedUser = await db.select().from(user).where(eq(user.id, linkedUserId)).limit(1);
                    if (linkedUser.length === 0 || linkedUser[0].isDeleted === 1) {
                        isOrphaned = true;
                    }
                }

                if (isOrphaned) {
                    inheritedCustomer = existingCustomers[0];
                    logger.info("Auth Info: Google registration inheriting orphaned/deleted linked customer record", { email: trimmedEmail });
                } else {
                    // This case should theoretically be handled by the user existence check above, 
                    // but as a safety measure for email-only matches:
                    logger.warn("Auth Warning: Google registration blocked, email already linked to active user in customer table", { email: trimmedEmail });
                    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
                }
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
                    isDeleted: 0, // Activated immediately for Google Users
                    verificationToken: null,
                    createdAt: now,
                    updatedAt: now,
                    alamat: "",
                    photo: picture || "",
                    urlphoto: picture || "",
                    updatephoto: "",
                });

                const insertedUserId = userResult.insertId;

                if (inheritedCustomer) {
                    // Reclaim existing customer
                    await tx.update(customer)
                        .set({
                            namaCustomer: name || "Google User",
                            userId: insertedUserId,
                            isDeleted: 0,
                        })
                        .where(eq(customer.custId, inheritedCustomer.custId));
                    logger.info("Auth Success: Updated orphaned customer record via Google", { custId: inheritedCustomer.custId, userId: insertedUserId });
                } else {
                    // Create new customer
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
                        completedDepositTime: getJakartaDate(),
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
                        createdAt: getJakartaDate(),
                        createdBy: insertedUserId,
                    });
                    logger.info("Auth Success: Created new customer record via Google", { custId, userId: insertedUserId });
                }
            });

            // Re-fetch the newly created user to get the full record
            const newUserRes = await db.select().from(user).where(eq(user.email, trimmedEmail)).limit(1);
            currentUser = newUserRes[0];

            logger.info("Auth Success: New user created and activated via Google", { email: trimmedEmail, userId: currentUser.id });

        } else {
            currentUser = userData[0];

            // 1. Check if user is deleted (is_deleted = 1)
            if (currentUser.isDeleted === 1) {
                logger.warn("Auth Warning: Google login attempt with deleted account", { email: trimmedEmail, userId: currentUser.id });
                if (isRedirect) {
                    return NextResponse.redirect(new URL("/login?error=deleted", process.env.NEXT_PUBLIC_URL!));
                }
                return NextResponse.json({ error: "Akun Anda telah dihapus" }, { status: 401 });
            }

            // Google users are automatically trusted/activated
            // No need to check for isDeleted === 2
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
            // Extract callbackUrl from state if available
            let targetUrl = "/";
            if (stateParam) {
                try {
                    const parsedState = JSON.parse(decodeURIComponent(stateParam));
                    if (parsedState.callbackUrl) {
                        targetUrl = parsedState.callbackUrl;
                    }
                } catch (e) {
                    logger.error("Auth Warning: Failed to parse Google state", { error: e, state: stateParam });
                }
            }

            // Pastikan karakter '#' di-encode ulang jika ter-decode
            const safeTargetUrl = targetUrl.replace(/#/g, "%23");
            const redirectUrl = new URL(safeTargetUrl, process.env.NEXT_PUBLIC_URL!);
            // Pastikan hash atau karakter spesial tidak ter-decode paksa
            return NextResponse.redirect(redirectUrl.toString());
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
