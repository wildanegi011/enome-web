import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendResetPasswordEmail } from "@/lib/mail";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const trimmedEmail = email.toLowerCase().trim();
        const userData = await db.select().from(user).where(eq(user.email, trimmedEmail)).limit(1);

        if (userData.length === 0) {
            // Safety: Don't reveal if email exists or not
            return NextResponse.json({ success: true, message: "Jika email terdaftar, tautan pemulihan akan dikirim." });
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
        logger.error("API Error: /api/auth/forgot-password", { error: error.message });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
