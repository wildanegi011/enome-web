import { db } from "@/lib/db";
import { kategoriProduk } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";

/**
 * Handler untuk mengambil daftar kategori produk.
 * Membatasi hasil hingga 4 kategori saja.
 */
export async function GET() {
    logger.info("API Request: GET /api/categories");
    try {
        // Mengambil data kategori produk dari database
        const data = await db
            .select()
            .from(kategoriProduk)
            .limit(4);

        logger.info("API Response: 200 /api/categories", { count: data.length });
        return NextResponse.json(data);
    } catch (error: any) {
        // Menangani error jika terjadi kegagalan saat fetch data
        logger.error("API Error: 500 /api/categories", { error: error.message });
        return NextResponse.json(
            { error: "Gagal mengambil data kategori" },
            { status: 500 }
        );
    }
}


