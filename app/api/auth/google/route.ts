import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, activityLogin } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { login } from "@/lib/auth-utils";
import { randomBytes } from "crypto";
import { execSync } from "child_process";
import logger from "@/lib/logger";

/**
 * Handler for Google OAuth login.
 * Verifies the ID token from Google and creates or logs in the user.
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let credential = "";
        let isRedirect = false;

        if (contentType.includes("application/json")) {
            const body = await request.json();
            credential = body.credential;
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            credential = formData.get("credential") as string;
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

            const insertResult = await db.insert(user).values({
                username: trimmedEmail,
                email: trimmedEmail,
                passwordHash: passwordHash,
                authKey: authKey,
                nama: name || "Google User",
                role: 2, // Customer
                status: 10, // Active
                // TODO : sementara langsung aktif nanti kedepanya set jadi 2 untuk lakukan aktifasi
                isDeleted: 0,
                createdAt: now,
                updatedAt: now,
                alamat: "",
                photo: picture || "",
                urlphoto: picture || "",
                updatephoto: "",
            });

            // Re-fetch the newly created user to get the full record (especially the ID)
            const newUserRes = await db.select().from(user).where(eq(user.email, trimmedEmail)).limit(1);
            currentUser = newUserRes[0];
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
            return NextResponse.redirect(new URL("/", request.url));
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        logger.error("API Error: /api/auth/google", { error: error.message });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
