import { NextRequest, NextResponse } from "next/server";
import { withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";
import { ProductService } from "@/lib/services/product-service";
import { produk, produkDetail } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Mengambil daftar produk yang online/highlight.
 * Harga disesuaikan berdasarkan kategori customer (distributor, agen, reseller, dll).
 * Mengecek status Flash Sale dan Pre-Order.
 *
 * @auth optional (untuk harga customer-specific)
 * @method GET
 * @query {{ categories?: string, priceRanges?: string, colors?: string, sizes?: string }} (comma-separated)
 * @response 200 — Array of processed product objects
 *   { produkId, namaProduk, gambar, kategori, finalMinPrice, finalMaxPrice, totalStock, colors, ... }[]
 * @response 500 — { error: "Internal Server Error" }
 */
export const GET = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/products");
    try {
        const { searchParams } = new URL(request.url);
        const categories = searchParams.get("categories")?.split(",").filter(Boolean);
        const priceRanges = searchParams.get("priceRanges")?.split(",").filter(Boolean);
        const colors = searchParams.get("colors")?.split(",").filter(Boolean);
        const sizes = searchParams.get("sizes")?.split(",").filter(Boolean);
        const brand = searchParams.get("brand")?.split(",").filter(Boolean);
        const gender = searchParams.get("gender")?.split(",").filter(Boolean);
        const search = searchParams.get("search") || undefined;

        const kategoriId = await CustomerService.getKategoriId(session?.user?.id);

        logger.debug("Products Fetch: Using kategoriId", { kategoriId, categories, priceRanges, colors, sizes, search });

        const processData = await ProductService.getProducts({
            kategoriId,
            limit: 50,
            categories,
            priceRanges,
            colors,
            sizes,
            brand,
            gender,
            search,
            where: eq(produk.isOnline, 1),
            // Urutkan berdasarkan stok terbanyak (sesuai logika legacy)
            orderBy: sql`SUM(${produkDetail.stokNormal}) DESC`
        });

        logger.info("Products Fetch: Success", { count: processData.length });
        return NextResponse.json(processData);
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
});

