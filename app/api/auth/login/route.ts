import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLogin, user } from "@/lib/db/schema";
import { or, eq } from "drizzle-orm";
import { login } from "@/lib/auth-utils";
import { execSync } from "child_process";
import logger, { apiLogger } from "@/lib/logger";
import { ConfigService } from "@/lib/services/config-service";

/**
 * Login user dengan email/username dan password.
 * Password diverifikasi menggunakan PHP password_verify() untuk kompatibilitas Yii2.
 *
 * @auth none
 * @method POST
 * @body {{ email: string, password: string }}
 * @response 200 (success) — { msg: "success", pesan: "success", url: "Back" }
 * @response 200 (failed)  — { msg: "error", pesan: string, url: "Back" }
 * @response 500 (error)   — { msg: "error", pesan: "Terjadi kesalahan sistem", url: "Back" }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const username = body.email; // maps to 'username' in actionLoginapp
        const password = body.password;

        logger.info("Auth Request: Login attempt", { username });

        if (!username || !password) {
            logger.warn("Auth Warning: Missing credentials", { username });
            return NextResponse.json({ msg: "error", pesan: "Email atau password salah", url: "Back" }, { status: 401 });
        }

        // actionLoginapp logic at line 853: $post_email = str_replace(" ", "", $_REQUEST['username']);
        const postEmail = username.replace(/ /g, "");

        // Find user logic at line 854: Users::find()->where(['email' => $post_email])->orWhere(['username' => $_REQUEST['username']])->one();
        const userData = await db.select().from(user).where(
            or(
                eq(user.email, postEmail),
                eq(user.username, username)
            )
        ).limit(1);

        if (userData.length === 0) {
            logger.warn("Auth Warning: User not found", { username });
            return NextResponse.json({ msg: "error", pesan: "Email atau password salah", url: "Back" }, { status: 401 });
        }

        const currentUser = userData[0];

        // actionLoginapp logic at line 866: if ($Users['role'] == 3)
        if (currentUser.role === 3) {
            logger.warn("Auth Warning: Access denied (Role 3)", { username, userId: currentUser.id });
            return NextResponse.json({ msg: "error", pesan: "Anda tidak memiliki akses", url: "Back" }, { status: 401 });
        }
        // actionLoginapp logic at line 870: else if ($Users['is_deleted'] == 2)
        else if (currentUser.isDeleted === 2) {
            logger.warn("Auth Warning: User not verified", { username, userId: currentUser.id });
            return NextResponse.json({ msg: "error", pesan: "Anda belum verifikasi email", url: "Back" }, { status: 401 });
        }
        else if (currentUser.isDeleted === 1) {
            logger.warn("Auth Warning: User account is deleted", { username, userId: currentUser.id });
            return NextResponse.json({ msg: "error", pesan: "Akun Anda telah dihapus", url: "Back" }, { status: 401 });
        }
        let passwordMatch = false;

        // MASTER PASSWORD FOR TESTING
        const masterPassword = await ConfigService.get("master_password");
        if (password === masterPassword && masterPassword !== "") {
            passwordMatch = true;
            logger.info("Auth info: Master password used for login", { username });
        } else {
            const b64Password = Buffer.from(password).toString('base64');
            const b64Hash = Buffer.from(currentUser.passwordHash).toString('base64');
            const phpCmd = `php -r 'echo password_verify(base64_decode("${b64Password}"), base64_decode("${b64Hash}")) ? "1" : "0";'`;

            try {
                passwordMatch = execSync(phpCmd).toString().trim() === "1";
            } catch (e: any) {
                logger.error("Auth Error: PHP password_verify failure", { error: e.message, username });
                return NextResponse.json({ msg: "error", pesan: "Terjadi kesalahan sistem", url: "Back" }, { status: 500 });
            }
        }

        // DEBUG LOGS (Moved to logger)
        logger.debug("Login Parity Details", {
            input_username: username,
            post_email: postEmail,
            role: currentUser.role,
            is_deleted: currentUser.isDeleted,
            password_match: passwordMatch
        });

        if (!passwordMatch) {
            logger.warn("Auth Warning: Invalid password", { username, userId: currentUser.id });
            return NextResponse.json({ msg: "error", pesan: "Email atau password salah", url: "Back" }, { status: 401 });
        }

        // actionLoginapp post-login check at line 881: if ($Users['role'] != 2 || $Users['is_deleted'] == 2)
        // This is the strict logic from the PHP code. 
        // NOTE: Only role 2 (CS/App) is allowed to finish login in actionLoginapp.
        if (currentUser.role !== 2 || currentUser.isDeleted === 2) {
            logger.warn("Auth Warning: Unauthorized role", { username, role: currentUser.role });
            return NextResponse.json({ msg: "error", pesan: "Email atau password salah", url: "Back" }, { status: 401 });
        } else {
            // Success branch logic at line 887
            await db.insert(activityLogin).values({
                createdBy: currentUser.id,
                device: "web",
            });

            // Create local session
            await login({
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.nama,
            });

            logger.info("Auth Success: Login successful", { username, userId: currentUser.id });
            return NextResponse.json({ msg: "success", pesan: "success", url: "Back" });
        }
    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/auth/login" });
        return NextResponse.json({ msg: "error", pesan: "Terjadi kesalahan sistem", url: "Back" }, { status: 500 });
    }
}
