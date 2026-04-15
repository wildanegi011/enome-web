import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendActivationEmail } from "@/lib/mail";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";

/**
 * Kirim ulang email verifikasi untuk akun yang belum diaktivasi.
 * Token lama otomatis di-overwrite oleh token baru.
 * Cooldown untuk mencegah spam.
 *
 * @auth none
 * @method POST
 * @body {{ email: string }}
 * @response 200 — { success: true, message: "Email verifikasi berhasil dikirim ulang." }
 * @response 400 — { error: string }
 * @response 429 — { error: string, remainingSeconds: number }
 * @response 500 — { error: "Terjadi kesalahan sistem" }
 */
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
        }

        const trimmedEmail = email.trim().toLowerCase();

        logger.info("Resend Verification Request", { email: trimmedEmail });

        // Cari user dengan email tersebut yang masih pending verification
        const users = await db.select().from(user)
            .where(and(eq(user.email, trimmedEmail), eq(user.isDeleted, 2)))
            .limit(1);

        if (users.length === 0) {
            logger.warn("Resend Verification Warning: No pending user found", { email: trimmedEmail });
            return NextResponse.json({
                error: "Email tidak ditemukan atau akun sudah aktif."
            }, { status: 400 });
        }

        const targetUser = users[0];

        // Cek cooldown — jangan izinkan resend jika token baru saja dibuat
        // Gunakan TIMESTAMPDIFF di SQL untuk menghindari mismatch timezone antara MySQL dan Node.js
        if (targetUser.verificationTokenCreatedAt) {
            const [elapsedResult]: any = await db.execute(
                sql`SELECT TIMESTAMPDIFF(SECOND, verificationTokenCreatedAt, NOW()) as elapsed FROM user WHERE id = ${targetUser.id}`
            );
            const elapsedSeconds = elapsedResult?.[0]?.elapsed ?? Infinity;

            if (elapsedSeconds < CONFIG.RESEND_VERIFICATION_COOLDOWN_SECS) {
                const remainingSeconds = CONFIG.RESEND_VERIFICATION_COOLDOWN_SECS - elapsedSeconds;
                logger.warn("Resend Verification Warning: Cooldown active", {
                    email: trimmedEmail,
                    remainingSeconds,
                });
                return NextResponse.json({
                    error: `Mohon tunggu ${remainingSeconds} detik sebelum mengirim ulang.`,
                    remainingSeconds,
                }, { status: 429 });
            }
        }

        // Generate token baru (invalidate token lama secara otomatis)
        const verificationToken = randomBytes(32).toString("hex");

        await db.update(user)
            .set({
                verificationToken: verificationToken,
                verificationTokenCreatedAt: sql`NOW()`,
            })
            .where(eq(user.id, targetUser.id));

        const activationLink = `${process.env.NEXT_PUBLIC_URL}/verify-email?token=${verificationToken}`;

        // Kirim email dalam background
        after(async () => {
            logger.info("Background job: Sending resend activation email", { email: trimmedEmail });
            await sendActivationEmail(trimmedEmail, activationLink);
        });

        logger.info("Resend Verification Success", { email: trimmedEmail, userId: targetUser.id });

        return NextResponse.json({
            success: true,
            message: "Email verifikasi berhasil dikirim ulang. Silakan cek inbox atau folder spam Anda.",
        });

    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/auth/resend-verification" });
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
