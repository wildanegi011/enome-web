import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cargo } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

/**
 * Handler untuk mendapatkan daftar kurir/cargo yang aktif.
 * Digunakan untuk opsi pengiriman di halaman checkout.
 */
export async function GET() {
    logger.debug("API Request: GET /api/couriers");
    try {
        const couriers = await db.select()
            .from(cargo)
            .where(eq(cargo.isAktif, 1));

        return NextResponse.json(couriers);
    } catch (error: any) {
        logger.error("API Error: /api/couriers", { error: error.message });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}

