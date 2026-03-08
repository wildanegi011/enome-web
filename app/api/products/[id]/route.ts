import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { produk, produkDetail, warna, size, customer, flashSale, flashSaleDetail, customerKategori, variant, productImage } from "@/lib/db/schema";

import { eq, and, sql, not, min, max, or } from "drizzle-orm";
import { withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { getJakartaDate } from "@/lib/date-utils";

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
    const { id } = params;

    logger.info("API Request: GET /api/products/[id]", { productId: id });

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

        // Map kategori ke kolom harga menggunakan CONFIG
        const priceColumnName = CONFIG.PRICE_COLUMNS[kategoriId] || CONFIG.PRICE_COLUMNS[CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID];
        const priceColumn = (produkDetail as any)[priceColumnName] || sql.raw(priceColumnName);
        const now = getJakartaDate();

        // 1. Ambil detail utama produk
        const productData = await db
            .select({
                product: produk,
                flashSaleId: sql<number>`(SELECT fs.id FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = produk.produk_id AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                flashSaleEndTime: sql<string>`(SELECT DATE_FORMAT(fs.waktu_selesai, '%Y-%m-%d %H:%i:%s') FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = produk.produk_id AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                preOrderId: sql<number>`(SELECT po.pre_order_id FROM pre_order po INNER JOIN pre_order_detail pod ON po.pre_order_id = pod.pre_order_id WHERE po.is_aktif = 1 AND pod.produk_id = produk.produk_id AND po.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                flashSaleDiscount: sql<number>`(SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1)`,
            })
            .from(produk)
            .where(and(eq(produk.produkId, id), eq(produk.isOnline, 1)))
            .limit(1);

        if (productData.length === 0) {
            logger.warn("Product Detail: Product not found or offline", { productId: id });
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const mainProduct = productData[0].product;
        const isOnFlashSale = !!productData[0].flashSaleId;
        const flashSaleEndTime = productData[0].flashSaleEndTime || null;
        const isOnPreOrder = !!productData[0].preOrderId;
        const flashSaleDiscount = productData[0].flashSaleDiscount || 0;

        // 2. Ambil statistik harga (min/max) dan total stok
        const priceStats = await db
            .select({
                minPrice: min(priceColumn),
                maxPrice: max(priceColumn),
                baseMinPrice: min(produkDetail.hargaJual),
                baseMaxPrice: max(produkDetail.hargaJual),
                totalStock: sql<string>`COALESCE(SUM(${produkDetail.stokNormal}), 0)`,
            })
            .from(produkDetail)
            .where(eq(produkDetail.produkId, id));

        const stats = priceStats[0];

        // Terapkan logika diskon Flash Sale ke statistik harga
        const finalMinPrice = isOnFlashSale
            ? Number(stats.baseMinPrice) - (Number(stats.baseMinPrice) * (Number(flashSaleDiscount) / 100))
            : Number(stats.minPrice);

        const finalMaxPrice = isOnFlashSale
            ? Number(stats.baseMaxPrice) - (Number(stats.baseMaxPrice) * (Number(flashSaleDiscount) / 100))
            : Number(stats.maxPrice);

        const commissionMin = Number(stats.baseMinPrice) - finalMinPrice;
        const commissionMax = Number(stats.baseMaxPrice) - finalMaxPrice;

        // 3. Ambil data detail varian untuk matrix pemilihan (warna & size)
        const details = await db
            .select({
                color: sql<string>`COALESCE(${warna.warna}, ${produkDetail.warnaId})`,
                size: produkDetail.size,
                variant: produkDetail.variant,
                variantId: produkDetail.variant,
                stock: produkDetail.stokNormal,
                price: priceColumn,
                basePrice: produkDetail.hargaJual,
                image: produkDetail.gambar,
                berat: produkDetail.berat,
                colorId: produkDetail.warnaId,
            })
            .from(produkDetail)
            .leftJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna)))
            .where(eq(produkDetail.produkId, id));

        // 4. Ekstrak warna unik yang tersedia
        const colorMap: Record<string, { id: string; name: string; value: string; image: string | null; totalStock: number }> = {};
        const rawColors = await db
            .selectDistinct({
                name: sql<string>`COALESCE(${warna.warna}, ${produkDetail.warnaId})`,
                value: sql<string>`COALESCE(${warna.kodeWarna}, '#cccccc')`,
            })
            .from(produkDetail)
            .leftJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna)))
            .where(eq(produkDetail.produkId, id));

        rawColors.forEach(c => {
            colorMap[c.name] = { id: String(c.name), name: c.name, value: c.value || "", image: null, totalStock: 0 };
        });

        details.forEach(d => {
            if (colorMap[d.color]) {
                colorMap[d.color].totalStock += Number(d.stock || 0);
                if (d.image && !colorMap[d.color].image) {
                    colorMap[d.color].image = d.image;
                }
            }
        });

        const colors = Object.values(colorMap);

        // 4b. Ekstrak variant unik yang tersedia (dari kolom variant langsung)
        const uniqueVariantsRows = await db
            .selectDistinct({
                name: produkDetail.variant,
            })
            .from(produkDetail)
            .where(and(
                eq(produkDetail.produkId, id),
                sql`${produkDetail.variant} IS NOT NULL`,
                sql`${produkDetail.variant} != ''`
            ));

        const types = uniqueVariantsRows.map(v => v.name).filter(Boolean) as string[];
        logger.info("Product Detail: Variants found", { productId: id, variantCount: types.length, types });

        // 5. Ambil daftar size yang tersedia
        const sizes = await db
            .selectDistinct({
                name: size.size,
                id: size.sizeId,
            })
            .from(produkDetail)
            .innerJoin(size, eq(produkDetail.size, size.size))
            .where(eq(produkDetail.produkId, id))
            .orderBy(size.sizeId);

        // 6. Kumpulkan semua gambar produk (gambar utama + gambar size + gambar per varian warna)
        let additionalImages: { gambar: string; warna: string | null }[] = [];
        try {
            additionalImages = await db
                .select({
                    gambar: productImage.gambar,
                    warna: productImage.warna
                })
                .from(productImage)
                .where(eq(productImage.produkId, id))
                .orderBy(productImage.id);
        } catch (err) {
            logger.error("Product Detail: Error fetching additional images", { productId: id, error: err });
            // Fallback to empty if table doesn't exist or query fails
            additionalImages = [];
        }

        const mainImages = [
            mainProduct.gambar,
            mainProduct.gambarSize,
            ...colors.map(c => c.image).filter(Boolean)
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        const allImages = [
            ...mainImages,
            ...additionalImages.map(img => img.gambar)
        ].filter((v, i, a) => v && a.indexOf(v) === i);




        // 7. Ambil daftar produk terkait dalam kategori yang sama
        const related = await db
            .select({
                produkId: produk.produkId,
                namaProduk: produk.namaProduk,
                gambar: produk.gambar,
                kategori: produk.kategori,
                minPrice: min(priceColumn),
                maxPrice: max(priceColumn),
                baseMinPrice: min(produkDetail.hargaJual),
                baseMaxPrice: max(produkDetail.hargaJual),
                totalStock: sql<string>`(SELECT COALESCE(SUM(stok_normal), 0) FROM produkdetail WHERE produk_id = produk.produk_id)`,
                colors: sql<string>`GROUP_CONCAT(DISTINCT CONCAT(COALESCE(${warna.warna}, ${produkDetail.warnaId}), '|', COALESCE(${warna.kodeWarna}, '#cccccc')) SEPARATOR ',')`,
                flashSaleId: sql<number>`(SELECT fs.id FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = produk.produk_id AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                flashSaleDiscount: sql<number>`(SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1)`,
            })
            .from(produk)
            .innerJoin(produkDetail, eq(produk.produkId, produkDetail.produkId))
            .innerJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna)))
            .where(
                and(
                    eq(produk.kategori, mainProduct.kategori),
                    not(eq(produk.produkId, id)),
                    eq(produk.isOnline, 1)
                )
            )
            .groupBy(produk.produkId)
            .limit(8);

        const processRelated = related.map((p: any) => {
            const hasFS = !!p.flashSaleId;
            const flashDiscountValue = hasFS ? Number(p.flashSaleDiscount || 0) : 0;
            const fMin = hasFS ? Number(p.baseMinPrice) - (Number(p.baseMinPrice) * (flashDiscountValue / 100)) : Number(p.minPrice);
            const fMax = hasFS ? Number(p.baseMaxPrice) - (Number(p.baseMaxPrice) * (flashDiscountValue / 100)) : Number(p.maxPrice);
            return {
                ...p,
                isOnFlashSale: hasFS,
                finalMinPrice: fMin,
                finalMaxPrice: fMax,
                baseMinPrice: Number(p.baseMinPrice),
                baseMaxPrice: Number(p.baseMaxPrice),
                discountPercentage: flashDiscountValue,
                totalStock: Number(p.totalStock || 0),
            };
        });

        logger.info("Product Detail: Fetch success", { productId: id, totalStock: Number(stats.totalStock) });
        return NextResponse.json({
            product: mainProduct,
            stats: {
                ...stats,
                finalMinPrice,
                finalMaxPrice,
                commissionMin,
                commissionMax,
                hasCommission: commissionMin > 0 || commissionMax > 0,
                isOnFlashSale,
                flashSaleEndTime,
                discountPercentage: isOnFlashSale ? Number(flashSaleDiscount || 0) : 0,
                isOnPreOrder,
                totalStock: Number(stats.totalStock || 0)
            },
            variants: {
                colors,
                sizes: sizes.map(s => s.name),
                types: types,
                matrix: details.map(d => {
                    const dPrice = isOnFlashSale
                        ? Number(d.basePrice) - (Number(d.basePrice) * (Number(flashSaleDiscount) / 100))
                        : d.price;
                    return { ...d, price: dPrice, originalCategoryPrice: d.price };
                }),
                berat: details[0]?.berat || 0,
            },
            images: mainImages,
            allImages: allImages,
            additionalImages: additionalImages,
            relatedProducts: processRelated,
        });


    } catch (error: any) {
        apiLogger.error(request, error, { productId: id });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});

