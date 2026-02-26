import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

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

        // Update user status
        await db.update(user)
            .set({
                isDeleted: 0,
                verificationToken: null,
                status: 10 // Active
            })
            .where(eq(user.id, targetUser.id));

        logger.info("Account activated Successfully", { userId: targetUser.id, email: targetUser.email });

        return NextResponse.json({ message: "Akun berhasil diaktifkan. Silakan login." });
    } catch (error: any) {
        logger.error("API Error: /api/auth/activate", { error: error.message });
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat aktivasi" }, { status: 500 });
    }
}
