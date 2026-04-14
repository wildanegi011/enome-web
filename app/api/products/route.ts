import { NextRequest, NextResponse } from "next/server";
import { withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";
import { ProductService } from "@/lib/services/product-service";
import { produk, produkDetail } from "@/lib/db/schema";
import { eq, sql, asc } from "drizzle-orm";

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
        
        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        
        // Sorting
        const sort = searchParams.get("sort") || "newest";

        const kategoriId = await CustomerService.getKategoriId(session?.user?.id);
        const priceColumn = CustomerService.getPriceColumn(kategoriId);

        logger.debug("Products Fetch: Using kategoriId", { kategoriId, page, limit, sort });

        let orderBy: any;
        switch (sort) {
            case "price_asc":
                orderBy = asc(priceColumn);
                break;
            case "price_desc":
                orderBy = sql`${priceColumn} DESC`; // priceColumn is a subquery or min/max, using raw SQL for DESC is safer here
                break;
            case "name_asc":
                orderBy = asc(produk.namaProduk);
                break;
            case "newest":
                orderBy = sql`${produk.tglRilis} DESC, ${produk.produkId} DESC`;
                break;
            default:
                orderBy = sql`SUM(${produkDetail.stokNormal}) DESC`;
        }

        const result = await ProductService.getProducts({
            kategoriId,
            page,
            limit,
            categories,
            priceRanges,
            colors,
            sizes,
            brand,
            gender,
            search,
            where: eq(produk.isOnline, 1),
            orderBy
        });

        logger.info("Products Fetch: Success", { count: result.data.length, total: result.total });
        return NextResponse.json({
            data: result.data,
            total: result.total,
            page,
            limit
        });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
});

