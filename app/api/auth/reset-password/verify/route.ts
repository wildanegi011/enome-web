import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { apiLogger } from "@/lib/logger";

/**
 * Memverifikasi apakah token reset password masih valid dan belum kedaluwarsa.
 *
 * @auth none
 * @method GET
 * @query token
 */

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        const userData = await db.select({
            id: user.id,
            passwordResetToken: user.passwordResetToken,
            isExpiredByTime: sql<number>`(TIMESTAMPDIFF(SECOND, passwordResetTokenCreatedAt, NOW()) > 3600)`
        })
        .from(user)
        .where(eq(user.passwordResetToken, token))
        .limit(1);

        if (userData.length === 0) {
            // Cek apakah token ini pernah ada (opsional, tapi untuk simpel kita sebut invalid saja)
            return NextResponse.json({ 
                valid: false, 
                type: "invalid",
                error: "Tautan tidak ditemukan atau sudah tidak berlaku." 
            }, { status: 200 });
        }

        const currentUser = userData[0];

        if (currentUser.isExpiredByTime) {
            return NextResponse.json({ 
                valid: false, 
                type: "expired",
                error: "Tautan ini sudah kadaluarsa karena sudah lebih dari 1 jam." 
            }, { status: 200 });
        }

        return NextResponse.json({ valid: true });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
