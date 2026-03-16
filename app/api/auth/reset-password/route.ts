import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { execSync } from "child_process";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Reset password user menggunakan token dari email.
 * Password di-hash via PHP bcrypt untuk kompatibilitas dengan Yii2.
 *
 * @auth none
 * @method POST
 * @body {{ token: string, password: string }}
 * @response 200 — { success: true, message: "Kata sandi berhasil diperbarui" }
 * @response 400 — { error: string } (token invalid / password terlalu pendek)
 * @response 500 — { error: "Terjadi kesalahan sistem" }
 */

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        // Ambil user dan cek validitas token serta kedaluwarsa via SQL
        const userData = await db.select({
            id: user.id,
            isExpired: sql<number>`(TIMESTAMPDIFF(SECOND, passwordResetTokenCreatedAt, NOW()) > 3600)`
        })
        .from(user)
        .where(eq(user.passwordResetToken, token))
        .limit(1);

        if (userData.length === 0) {
            return NextResponse.json({ error: "Token tidak valid atau sudah digunakan" }, { status: 400 });
        }

        const currentUser = userData[0];

        if (currentUser.isExpired) {
            return NextResponse.json({ error: "Tautan telah kedaluwarsa, silakan minta tautan baru" }, { status: 400 });
        }

        // Hash password menggunakan PHP untuk kompatibilitas dengan Yii2
        const b64Password = Buffer.from(password).toString('base64');
        const phpCmd = `php -r 'echo password_hash(base64_decode("${b64Password}"), PASSWORD_BCRYPT, ["cost" => 13]);'`;

        let passwordHash = "";
        try {
            passwordHash = execSync(phpCmd).toString().trim();
        } catch (e: any) {
            logger.error("Auth Error: Reset password PHP hash failure", { error: e.message });
            return NextResponse.json({ error: "Gagal memproses kata sandi" }, { status: 500 });
        }

        // Update password and clear token
        await db.update(user)
            .set({
                passwordHash: passwordHash,
                passwordResetToken: null,
                updatedAt: Math.floor(Date.now() / 1000)
            })
            .where(eq(user.id, currentUser.id));

        logger.info("Password reset success", { userId: currentUser.id });
        return NextResponse.json({ success: true, message: "Kata sandi berhasil diperbarui" });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
