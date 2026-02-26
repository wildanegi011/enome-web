import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";
import { ProductService } from "@/lib/services/product-service";
import { produk, produkDetail } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Handler untuk mengambil daftar produk (highlighted/online).
 * Menyesuaikan harga berdasarkan kategori customer (distributor, agen, reseller, dll).
 * Mengecek status Flash Sale dan Pre-Order untuk setiap produk.
 */
export async function GET() {
    logger.info("API Request: GET /api/products");
    try {
        const session = await getSession();
        const kategoriId = await CustomerService.getKategoriId(session?.user?.id);

        logger.debug("Products Fetch: Using kategoriId", { kategoriId });

        const processData = await ProductService.getProducts({
            kategoriId,
            limit: 6,
            where: eq(produk.isOnline, 1),
            // Urutkan berdasarkan stok terbanyak (sesuai logika legacy)
            orderBy: sql`SUM(${produkDetail.stokNormal}) DESC`
        });

        logger.info("Products Fetch: Success", { count: processData.length });
        return NextResponse.json(processData);
    } catch (error: any) {
        logger.error("API Error: /api/products", { error: error.message });
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}


