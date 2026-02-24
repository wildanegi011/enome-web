import { db } from "@/lib/db";
import { produk, produkDetail, warna, customer, flashSale, flashSaleDetail, customerKategori } from "@/lib/db/schema";
import { and, eq, desc, min, max, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";
import { CONFIG } from "@/lib/config";

/**
 * Handler untuk mengambil daftar produk terbaru (New Arrivals).
 * Diurutkan berdasarkan tanggal rilis (tglRilis) terbaru.
 * Harga disesuaikan dengan kategori customer session.
 */
export async function GET() {
    logger.info("API Request: GET /api/products/new-arrivals");
    try {
        const session = await getSession();
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

        logger.debug("New Arrivals Fetch: Using kategoriId", { kategoriId });

        // Map kategori ke kolom harga menggunakan CONFIG
        const priceColumnName = CONFIG.PRICE_COLUMNS[kategoriId] || CONFIG.PRICE_COLUMNS[CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID];
        const priceColumn = (produkDetail as any)[priceColumnName] || sql.raw(priceColumnName);

        const now = new Date();

        // Query produk terbaru
        const data = await db
            .select({
                produkId: produk.produkId,
                namaProduk: produk.namaProduk,
                kategori: produk.kategori,
                gambar: produk.gambar,
                tglRilis: produk.tglRilis,
                minPrice: min(priceColumn),
                maxPrice: max(priceColumn),
                baseMinPrice: min(produkDetail.hargaJual),
                baseMaxPrice: max(produkDetail.hargaJual),
                totalStock: sql<number>`SUM(${produkDetail.stokNormal})`,
                isOnline: produk.isOnline,
                isAktif: produk.isAktif,
                isHighlighted: produk.isHighlighted,
                colors: sql<string>`GROUP_CONCAT(DISTINCT CONCAT(${warna.warna}, '|', ${warna.kodeWarna}) SEPARATOR ',')`,
                flashSaleId: sql<number>`(SELECT fs.id FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = ${produk.produkId} AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                preOrderId: sql<number>`(SELECT po.pre_order_id FROM pre_order po INNER JOIN pre_order_detail pod ON po.pre_order_id = pod.pre_order_id WHERE po.is_aktif = 1 AND pod.produk_id = ${produk.produkId} AND po.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                flashSaleDiscount: sql<number>`(SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1)`,
            })
            .from(produk)
            .leftJoin(produkDetail, eq(produk.produkId, produkDetail.produkId))
            .leftJoin(warna, eq(produkDetail.warnaId, warna.warnaId))
            .where(
                eq(produk.isOnline, 1)
            )
            .groupBy(produk.produkId)
            // Urutkan dari yang terbaru dirilis
            .orderBy(desc(produk.tglRilis))
            .limit(6);

        const processData = data.map((p: any) => {
            const isOnFlashSale = !!p.flashSaleId;
            const isOnPreOrder = !!p.preOrderId;

            const finalMinPrice = isOnFlashSale
                ? Number(p.baseMinPrice) - (Number(p.baseMinPrice) * (Number(p.flashSaleDiscount || 0) / 100))
                : p.minPrice;

            const finalMaxPrice = isOnFlashSale
                ? Number(p.baseMaxPrice) - (Number(p.baseMaxPrice) * (Number(p.flashSaleDiscount || 0) / 100))
                : p.maxPrice;

            return {
                ...p,
                isOnFlashSale,
                isOnPreOrder,
                finalMinPrice,
                finalMaxPrice
            };
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


