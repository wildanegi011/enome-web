import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keranjang } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";

/**
 * Handler sederhana untuk mendapatkan jumlah total item (unique baris) di keranjang user.
 * Digunakan untuk menampilkan badge jumlah keranjang di Navbar.
 */
export async function GET(request: NextRequest) {
    logger.debug("API Request: GET /api/cart/count");
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ total: 0 });
        }

        const userId = session.user.id;

        // Hitung total baris keranjang aktif
        const cartCount = await db.select({ total: sql<number>`count(*)` })
            .from(keranjang)
            .where(and(eq(keranjang.custId, userId), eq(keranjang.isDeleted, 0)));

        const totalItems = Number(cartCount[0]?.total || 0);

        return NextResponse.json({
            total: totalItems
        });

    } catch (error: any) {
        logger.error("API Error: /api/cart/count", { error: error.message });
        return NextResponse.json({ total: 0, error: error.message }, { status: 500 });
    }
}

