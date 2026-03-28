import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { produk, produkDetail, warna, size, customer, flashSale, flashSaleDetail, customerKategori, variant, productImage } from "@/lib/db/schema";

import { eq, and, sql, not, min, max, or, asc } from "drizzle-orm";
import { withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { getJakartaDate } from "@/lib/date-utils";
import { ProductService } from "@/lib/services/product-service";

/**
 * Mengambil data detail satu produk berdasarkan ID.
 * Mencakup varian (warna, size), stok per varian, matrix harga,
 * status diskon Flash Sale/Pre-Order, dan produk terkait.
 *
 * @auth optional (untuk harga customer-specific)
 * @method GET
 * @params {{ id: string }} (produk ID)
 * @response 200 — {
 *   product: { produkId, namaProduk, deskripsi, detail, gambar, kategori, ... },
 *   stats: { finalMinPrice, finalMaxPrice, totalStock, isOnFlashSale, isOnPreOrder, ... },
 *   variants: { colors: Color[], sizes: string[], matrix: Variant[] },
 *   images: string[],
 *   relatedProducts: Product[]
 * }
 * @response 404 — { error: "Product not found" }
 * @response 500 — { error: "Internal Server Error" }
 */
export const GET = withOptionalAuth(async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    session: any
) => {
    const params = await context.params;
    const id = decodeURIComponent(params.id);

    logger.info("API Request: GET /api/products/[id]", { productId: id, originalId: params.id });

    try {
        let kategoriId = CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID;

        if (session?.user?.id) {
            const customerData = await db.select()
                .from(customer)
                .where(eq(customer.userId, session.user.id))
                .limit(1);
            if (customerData.length > 0) {
                kategoriId = customerData[0].kategoriCustomerId || CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID;
            }
        }

        const productData = await ProductService.getProductDetail(id, kategoriId);

        if (!productData) {
            logger.warn("Product Detail: Product not found or offline", { productId: id });
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        logger.info("Product Detail: Fetch success", { productId: id });
        return NextResponse.json(productData);

    } catch (error: any) {
        apiLogger.error(request, error, { productId: id });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});

