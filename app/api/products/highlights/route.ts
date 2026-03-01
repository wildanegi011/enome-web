import { NextResponse } from "next/server";
import logger, { apiLogger } from "@/lib/logger";
import { ProductService } from "@/lib/services/product-service";
import { produk } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Mengambil produk highlight (Deal of the Month).
 * Diurutkan berdasarkan highlightOrder. Harga menggunakan kategori retail default.
 *
 * @auth none
 * @method GET
 * @response 200 — Product[] (max 5 highlighted products)
 * @response 500 — { error: "Internal Server Error" }
 */
export async function GET() {
    logger.info("API Request: GET /api/products/highlights");
    try {
        // Highlights bersifat publik, gunakan kategori retail default
        const kategoriId = CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID;

        const processData = await ProductService.getProducts({
            kategoriId,
            limit: 5,
            where: and(
                eq(produk.isHighlighted, 1),
                eq(produk.isOnline, 1)
            ),
            orderBy: asc(produk.highlightOrder)
        });

        logger.info("Highlights Fetch: Success", { count: processData.length });
        return NextResponse.json(processData);
    } catch (error: any) {
        apiLogger.error(null, error, { route: "/api/products/highlights" });
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
