import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { statusOrder, statusTagihan } from "@/lib/db/schema";
import logger from "@/lib/logger";

/**
 * Handler untuk mendapatkan daftar master status order dan status tagihan.
 * Digunakan untuk mengisi opsi dropdown filter di halaman riwayat pesanan.
 */
export async function GET(request: NextRequest) {
    logger.debug("API Request: GET /api/user/orders/statuses");
    try {
        const orderStatuses = await db.select().from(statusOrder);
        const tagihanStatuses = await db.select().from(statusTagihan);

        return NextResponse.json({
            orderStatuses,
            tagihanStatuses
        });
    } catch (error: any) {
        logger.error("API Error: /api/user/orders/statuses", { error: error.message });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}

