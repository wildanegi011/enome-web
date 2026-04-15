import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";

/**
 * Aktivasi akun user berdasarkan verification token dari email.
 * Mengubah status `isDeleted` dari 2 (pending) menjadi 0 (aktif).
 * Token berlaku selama VERIFICATION_TOKEN_EXPIRY_HOURS (default: 24 jam).
 *
 * @auth none
 * @method GET
 * @query {{ token: string }}
 * @response 200 — { message: "Akun berhasil diaktifkan. Silakan login." }
 * @response 400 — { error: "Token tidak valid atau sudah kedaluwarsa" }
 * @response 410 — { error: "Token telah kedaluwarsa...", expired: true }
 * @response 500 — { error: "Terjadi kesalahan sistem saat aktivasi" }
 */

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
        logger.warn("Activation Warning: Missing token");
        return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
    }

    try {
        const users = await db.select().from(user).where(eq(user.verificationToken, token)).limit(1);

        if (users.length === 0) {
            logger.warn("Activation Warning: Invalid/Expired token", { token });
            return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });
        }

        const targetUser = users[0];

        // Cek apakah token sudah kedaluwarsa
        // Gunakan TIMESTAMPDIFF di SQL untuk menghindari mismatch timezone antara MySQL dan Node.js
        if (targetUser.verificationTokenCreatedAt) {
            const [expiryResult]: any = await db.execute(
                sql`SELECT TIMESTAMPDIFF(SECOND, verificationTokenCreatedAt, NOW()) as elapsed FROM user WHERE id = ${targetUser.id}`
            );
            const elapsedSeconds = expiryResult?.[0]?.elapsed ?? 0;
            const expirySeconds = CONFIG.VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60;

            if (elapsedSeconds > expirySeconds) {
                logger.warn("Activation Warning: Token expired", { userId: targetUser.id, email: targetUser.email });
                return NextResponse.json({
                    error: "Token verifikasi telah kedaluwarsa. Silakan kirim ulang email verifikasi.",
                    expired: true,
                }, { status: 410 });
            }
        }

        // Update user status
        await db.update(user)
            .set({
                isDeleted: 0,
                verificationToken: null,
                verificationTokenCreatedAt: null,
                status: 10 // Active
            })
            .where(eq(user.id, targetUser.id));

        logger.info("Account activated Successfully", { userId: targetUser.id, email: targetUser.email });

        return NextResponse.json({ message: "Akun berhasil diaktifkan. Silakan login." });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat aktivasi" }, { status: 500 });
    }
}
