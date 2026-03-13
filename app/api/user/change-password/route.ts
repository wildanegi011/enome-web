import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth-utils";
import { execSync } from "child_process";
import logger, { apiLogger } from "@/lib/logger";
import * as z from "zod";

const changePasswordSchema = z.object({
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok",
    path: ["confirmPassword"],
});

/**
 * Mengubah password user yang sedang login.
 * Menggunakan Zod untuk validasi skema.
 *
 * @auth required
 * @method POST
 * @body { newPassword, confirmPassword }
 * @response 200 — { success: true, message: "Password berhasil diubah" }
 * @response 400 — { error: string } (validasi gagal)
 * @response 401 — { error: "Unauthorized" }
 * @response 500 — { error: "Terjadi kesalahan sistem" }
 */
export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: POST /api/user/change-password");
    try {
        const userId = session.user.id;
        const body = await request.json();

        // 1. Schema Validation with Zod
        const result = changePasswordSchema.safeParse(body);
        if (!result.success) {
            const errorMessage = result.error.issues[0].message;
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        const { newPassword } = result.data;

        // 2. Fetch User Data
        const userData = await db.select().from(user).where(eq(user.id, userId)).limit(1);
        if (userData.length === 0) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
        }

        // 3. Hash New Password via PHP
        const b64NewPassword = Buffer.from(newPassword).toString('base64');
        const phpHashCmd = `php -r 'echo password_hash(base64_decode("${b64NewPassword}"), PASSWORD_BCRYPT, ["cost" => 13]);'`;

        let newPasswordHash = "";
        try {
            newPasswordHash = execSync(phpHashCmd).toString().trim();
        } catch (e: any) {
            logger.error("Auth Error: Change password PHP hash failure", { error: e.message, userId });
            return NextResponse.json({ error: "Gagal memproses password baru" }, { status: 500 });
        }

        // 4. Update Database
        await db.update(user)
            .set({
                passwordHash: newPasswordHash,
                updatedAt: Math.floor(Date.now() / 1000)
            })
            .where(eq(user.id, userId));

        logger.info("Auth Success: Password changed successfully", { userId });
        return NextResponse.json({ success: true, message: "Password berhasil diubah" });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat mengubah password" }, { status: 500 });
    }
});
