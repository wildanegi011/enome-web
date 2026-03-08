import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendResetPasswordEmail } from "@/lib/mail";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Request reset password — mengirim email berisi link reset.
 * Tidak mengungkapkan apakah email terdaftar atau tidak (security best practice).
 *
 * @auth none
 * @method POST
 * @body {{ email: string }}
 * @response 200 — { success: true, message?: string }
 * @response 400 — { error: "Email is required" }
 * @response 500 — { error: "Terjadi kesalahan sistem" }
 */

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const trimmedEmail = email.toLowerCase().trim();
        const userData = await db.select().from(user).where(eq(user.email, trimmedEmail)).limit(1);

        if (userData.length === 0 || userData[0].isDeleted === 1) {
            logger.warn("Forgot Password Warning: Email not registered or account deleted", { email: trimmedEmail });
            return NextResponse.json({ error: "Email tidak terdaftar" }, { status: 404 });
        }

        const resetToken = randomBytes(32).toString("hex");
        // Update user with reset token
        await db.update(user)
            .set({ passwordResetToken: resetToken })
            .where(eq(user.email, trimmedEmail));

        const resetLink = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${resetToken}`;

        after(async () => {
            logger.info("Background job: Sending reset password email", { email: trimmedEmail });
            await sendResetPasswordEmail(trimmedEmail, resetLink);
        });

        logger.info("Forgot password request success, email queued in background", { email: trimmedEmail });
        return NextResponse.json({ success: true });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
