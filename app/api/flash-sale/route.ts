import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { flashSale, flashSaleDetail, produk, produkDetail, warna } from "@/lib/db/schema";
import { and, eq, sql, max, min, inArray, isNotNull, or } from "drizzle-orm";
import { withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { getJakartaDate } from "@/lib/date-utils";
import { CustomerService } from "@/lib/services/customer-service";
import { CONFIG } from "@/lib/config";

/**
 * Mengambil data Flash Sale yang sedang aktif beserta produk-produknya.
 * Data difilter berdasarkan waktu aktif (`waktu_mulai` <= NOW() <= `waktu_selesai`)
 * dan mencocokkan `customer_kategori_id` jika user login.
 *
 * @auth optional
 * @method GET
 * @response 200 — { event: { id, namaEvent, waktuSelesai }, products: Product[] }
 * @response 200 (no active) — { event: null, products: [] }
 * @response 500 — { error: "Terjadi kesalahan sistem" }
 */
export const GET = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/flash-sale");
    try {
        const now = getJakartaDate();
        let kategoriId = CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID;

        if (session && session.user) {
            kategoriId = await CustomerService.getKategoriId(session.user.id);
        }

        // 1. Cari event Flash Sale yang aktif
        const activeFlashSales = await db.select({
            id: flashSale.id,
            namaEvent: flashSale.namaEvent,
            waktuMulai: sql<string>`DATE_FORMAT(${flashSale.waktuMulai}, '%Y-%m-%d %H:%i:%s')`,
            waktuSelesai: sql<string>`DATE_FORMAT(${flashSale.waktuSelesai}, '%Y-%m-%d %H:%i:%s')`,
            kategoriId: flashSale.customerKategoriId,
        })
            .from(flashSale)
            .where(
                and(
                    eq(flashSale.isAktif, 1),
                    sql`${now} BETWEEN ${flashSale.waktuMulai} AND ${flashSale.waktuSelesai}`
                )
            )
            .orderBy(flashSale.waktuSelesai);

        if (activeFlashSales.length === 0) {
            logger.info("Flash Sale Fetch: No active flash sale currently");
            return NextResponse.json({ event: null, products: [] });
        }

        // 2. Filter event berdasarkan kategori customer jika login
        let validEvent = activeFlashSales.find(event => {
            if (!event.kategoriId) return true; // berlaku untuk semua
            return event.kategoriId.includes(String(kategoriId));
        });

        if (!validEvent) {
            validEvent = activeFlashSales[0]; // fallback ke flash sale pertama jika ada
        }

        if (!validEvent) {
            return NextResponse.json({ event: null, products: [] });
        }

        // 3. Ambil produk-produk dari Flash Sale tersebut
        const fsDetails = await db.select({
            produkId: flashSaleDetail.produkId,
        })
            .from(flashSaleDetail)
            .where(
                and(
                    isNotNull(flashSaleDetail.produkId),
                    eq(flashSaleDetail.flashSaleId, validEvent.id)
                )
            );

        if (fsDetails.length === 0) {
            return NextResponse.json({
                event: {
                    id: validEvent.id,
                    namaEvent: validEvent.namaEvent,
                    waktuSelesai: validEvent.waktuSelesai,
                },
                products: []
            });
        }

        const produkIds = fsDetails.map((d: any) => String(d.produkId));

        // 4. Ambil detail produk seperti di product-service.ts
        const priceColumn = CustomerService.getPriceColumn(kategoriId);

        const productsQuery = await db.select({
            produkId: produk.produkId,
            namaProduk: produk.namaProduk,
            kategori: produk.kategori,
            gambar: produk.gambar,
            minPrice: min(priceColumn),
            maxPrice: max(priceColumn),
            baseMinPrice: min(produkDetail.hargaJual),
            baseMaxPrice: max(produkDetail.hargaJual),
            totalStock: sql<number>`(SELECT COALESCE(SUM(stok_normal), 0) FROM produkdetail WHERE produk_id = produk.produk_id)`,
            colors: sql<string>`GROUP_CONCAT(DISTINCT CONCAT(COALESCE(${warna.warna}, ${produkDetail.warnaId}), '|', COALESCE(${warna.kodeWarna}, '#cccccc')) SEPARATOR ',')`,
            flashSaleDiscount: sql<number>`(SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1)`,
        })
            .from(produk)
            .leftJoin(produkDetail, eq(produk.produkId, produkDetail.produkId))
            .leftJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna)))
            .where(
                and(
                    eq(produk.isOnline, 1),
                    inArray(produk.produkId, produkIds)
                )
            )
            .groupBy(produk.produkId)
            .limit(10); // Ambil maksimal 10 produk untuk section home

        // 5. Proses kalkulasi harga flash sale
        const processData = productsQuery.map((p: any) => {
            const finalMinPrice = Number(p.baseMinPrice) - (Number(p.baseMinPrice) * (Number(p.flashSaleDiscount || 0) / 100));
            const finalMaxPrice = Number(p.baseMaxPrice) - (Number(p.baseMaxPrice) * (Number(p.flashSaleDiscount || 0) / 100));
            const commissionMin = Number(p.baseMinPrice) - Number(finalMinPrice);
            const commissionMax = Number(p.baseMaxPrice) - Number(finalMaxPrice);

            return {
                ...p,
                isOnFlashSale: true,
                isOnPreOrder: false,
                finalMinPrice,
                finalMaxPrice,
                commissionMin,
                commissionMax,
                discountPercentage: Number(p.flashSaleDiscount || 0),
                totalStock: Number(p.totalStock || 0),
                hasCommission: commissionMin > 0 || commissionMax > 0
            };
        });

        logger.info("Flash Sale Fetch: Success", { eventId: validEvent.id, productCount: processData.length });

        return NextResponse.json({
            event: {
                id: validEvent.id,
                namaEvent: validEvent.namaEvent,
                waktuSelesai: validEvent.waktuSelesai,
            },
            products: processData
        });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
});
