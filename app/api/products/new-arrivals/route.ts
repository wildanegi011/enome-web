import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";
import { ProductService } from "@/lib/services/product-service";
import { produk } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

/**
 * Handler untuk mengambil daftar produk terbaru (New Arrivals).
 * Diurutkan berdasarkan tanggal rilis (tglRilis) terbaru.
 * Harga disesuaikan dengan kategori customer session.
 */
export async function GET() {
    logger.info("API Request: GET /api/products/new-arrivals");
    try {
        const session = await getSession();
        const kategoriId = await CustomerService.getKategoriId(session?.user?.id);

        logger.debug("New Arrivals Fetch: Using kategoriId", { kategoriId });

        const processData = await ProductService.getProducts({
            kategoriId,
            limit: 20,
            // Urutkan dari yang terbaru dirilis
            orderBy: desc(produk.tglRilis)
        });

        logger.info("New Arrivals Fetch: Success", { count: processData.length });
        return NextResponse.json(processData);
    } catch (error: any) {
        logger.error("API Error: /api/products/new-arrivals", { error: error.message });
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}


