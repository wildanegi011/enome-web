import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rekeningPembayaran } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

/**
 * Handler untuk mendapatkan daftar metode pembayaran (rekening bank/E-Wallet) yang aktif.
 */
export async function GET() {
    logger.debug("API Request: GET /api/payment-methods");
    try {
        const methods = await db.select()
            .from(rekeningPembayaran)
            .where(eq(rekeningPembayaran.isAktif, 1));

        return NextResponse.json(methods);
    } catch (error: any) {
        logger.error("API Error: /api/payment-methods", { error: error.message });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}

