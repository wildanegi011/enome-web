import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { execSync } from "child_process";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const userData = await db.select().from(user).where(eq(user.passwordResetToken, token)).limit(1);

        if (userData.length === 0) {
            return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });
        }

        const currentUser = userData[0];

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
        logger.error("API Error: /api/auth/reset-password", { error: error.message });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
