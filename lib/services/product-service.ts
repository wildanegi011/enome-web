import { db } from "@/lib/db";
import { produk, produkDetail, warna, size, productImage, customerKategori } from "@/lib/db/schema";
import { and, eq, sql, min, max, or, like, inArray, not, asc } from "drizzle-orm";
import { getJakartaDate } from "@/lib/date-utils";
import { CustomerService } from "./customer-service";
import { unstable_cache } from "next/cache";

export interface ProductQueryOptions {
    kategoriId: number;
    limit?: number;
    page?: number;
    where?: any;
    orderBy?: any;
    categories?: string[];
    priceRanges?: string[];
    colors?: string[];
    sizes?: string[];
    brand?: string[];
    gender?: string[];
    search?: string;
}

/**
 * Internal helper for fetching product detail, used by cached and non-cached versions.
 */
async function fetchProductDetailInternal(id: string, kategoriId: number) {
    const priceColumn = CustomerService.getPriceColumn(kategoriId);
    const now = getJakartaDate();

    // 1. Fetch main product and flash sale/pre-order status
    const productDataResult = await db
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

    if (productDataResult.length === 0) return null;

    const mainProduct = productDataResult[0].product;
    const isOnFlashSale = !!productDataResult[0].flashSaleId;
    const flashSaleEndTime = productDataResult[0].flashSaleEndTime || null;
    const isOnPreOrder = !!productDataResult[0].preOrderId;
    const flashSaleDiscount = productDataResult[0].flashSaleDiscount || 0;

    // 2. Parallel queries for stats, details, images, and related products
    const [priceStats, details, sizesData, additionalImagesData, related] = await Promise.all([
        db.select({
            minPrice: min(priceColumn),
            maxPrice: max(priceColumn),
            baseMinPrice: min(produkDetail.hargaJual),
            baseMaxPrice: max(produkDetail.hargaJual),
            totalStock: sql<number>`COALESCE(SUM(${produkDetail.stokNormal}), 0)`,
        }).from(produkDetail).where(eq(produkDetail.produkId, id)),
        db.select({
            color: sql<string>`COALESCE(${warna.warna}, ${produkDetail.warnaId})`,
            colorValue: sql<string>`COALESCE(${warna.kodeWarna}, '#cccccc')`,
            size: produkDetail.size,
            variant: produkDetail.variant,
            stock: produkDetail.stokNormal,
            price: priceColumn,
            basePrice: produkDetail.hargaJual,
            image: produkDetail.gambar,
            berat: produkDetail.berat,
            colorId: produkDetail.warnaId,
        }).from(produkDetail).leftJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna))).where(eq(produkDetail.produkId, id)),
        db.selectDistinct({ name: size.size, id: size.sizeId }).from(produkDetail).innerJoin(size, eq(produkDetail.size, size.size)).where(eq(produkDetail.produkId, id)).orderBy(size.sizeId),
        db.select({ gambar: productImage.gambar, warna: productImage.warna }).from(productImage).where(eq(productImage.produkId, id)).orderBy(asc(productImage.urutan)),
        db.select({
            produkId: produk.produkId,
            namaProduk: produk.namaProduk,
            gambar: produk.gambar,
            kategori: produk.kategori,
            minPrice: min(priceColumn),
            maxPrice: max(priceColumn),
            baseMinPrice: min(produkDetail.hargaJual),
            baseMaxPrice: max(produkDetail.hargaJual),
            totalStock: sql<number>`(SELECT COALESCE(SUM(stok_normal), 0) FROM produkdetail WHERE produk_id = produk.produk_id)`,
            colors: sql<string>`GROUP_CONCAT(DISTINCT CONCAT(COALESCE(${warna.warna}, ${produkDetail.warnaId}), '|', COALESCE(${warna.kodeWarna}, '#cccccc')) SEPARATOR ',')`,
            flashSaleId: sql<number>`(SELECT fs.id FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = produk.produk_id AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
            flashSaleDiscount: sql<number>`(SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1)`,
        }).from(produk).innerJoin(produkDetail, eq(produk.produkId, produkDetail.produkId)).innerJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna))).where(and(eq(produk.kategori, mainProduct.kategori), not(eq(produk.produkId, id)), eq(produk.isOnline, 1))).groupBy(produk.produkId).limit(5),
    ]);

    const stats = priceStats[0] || { minPrice: 0, maxPrice: 0, baseMinPrice: 0, baseMaxPrice: 0, totalStock: 0 };
    const finalMinPrice = isOnFlashSale ? Number(stats.baseMinPrice) - (Number(stats.baseMinPrice) * (Number(flashSaleDiscount) / 100)) : Number(stats.minPrice);
    const finalMaxPrice = isOnFlashSale ? Number(stats.baseMaxPrice) - (Number(stats.baseMaxPrice) * (Number(flashSaleDiscount) / 100)) : Number(stats.maxPrice);
    const commissionMin = Number(stats.baseMinPrice) - finalMinPrice;
    const commissionMax = Number(stats.baseMaxPrice) - finalMaxPrice;

    const colorMap: Record<string, { id: string; name: string; value: string; image: string | null; totalStock: number }> = {};
    details.forEach(d => {
        if (!colorMap[d.color]) {
            colorMap[d.color] = { id: String(d.colorId || d.color), name: d.color, value: d.colorValue || "", image: d.image || null, totalStock: 0 };
        }
        colorMap[d.color].totalStock += Number(d.stock || 0);
        if (d.image && !colorMap[d.color].image) colorMap[d.color].image = d.image;
    });

    const colors = Object.values(colorMap);
    const types = [...new Set(details.map(d => d.variant).filter(Boolean))] as string[];

    return {
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
            sizes: sizesData.map(s => s.name),
            types: types,
            matrix: details.map(d => {
                const dPrice = isOnFlashSale ? Number(d.basePrice) - (Number(d.basePrice) * (Number(flashSaleDiscount) / 100)) : d.price;
                return { ...d, price: dPrice, originalCategoryPrice: d.price };
            }),
            berat: details[0]?.berat || 0,
        },
        images: [mainProduct.gambar, mainProduct.gambarSize, ...colors.map(c => c.image).filter(Boolean)].filter((v, i, a) => v && a.indexOf(v) === i),
        additionalImages: additionalImagesData,
        relatedProducts: related.map((p: any) => {
            const hasFS = !!p.flashSaleId;
            const fD = hasFS ? Number(p.flashSaleDiscount || 0) : 0;
            return {
                ...p,
                isOnFlashSale: hasFS,
                finalMinPrice: hasFS ? Number(p.baseMinPrice) - (Number(p.baseMinPrice) * (fD / 100)) : Number(p.minPrice),
                finalMaxPrice: hasFS ? Number(p.baseMaxPrice) - (Number(p.baseMaxPrice) * (fD / 100)) : Number(p.maxPrice),
                discountPercentage: fD,
                totalStock: Number(p.totalStock || 0)
            };
        }),
    };
}


export class ProductService {
    /**
     * Base query for fetching products with prices, stock, and status.
     * Note: Not cached with unstable_cache because options may contain non-serializable Drizzle SQL objects.
     */
    static async getProducts(options: ProductQueryOptions) {
        const { kategoriId, limit = 12, page = 1, where, orderBy } = options;
        const offset = (page - 1) * limit;
        const priceColumn = CustomerService.getPriceColumn(kategoriId);
        const now = getJakartaDate();

        // --- Build Conditions ---
        const conditions: any[] = [];
        if (where) conditions.push(where);

        if (options.categories && options.categories.length > 0) {
            conditions.push(inArray(produk.kategori, options.categories));
        }

        if (options.colors && options.colors.length > 0) {
            conditions.push(inArray(warna.warna, options.colors));
        }

        if (options.sizes && options.sizes.length > 0) {
            conditions.push(inArray(produkDetail.size, options.sizes));
        }
        
        if (options.brand && options.brand.length > 0) {
            conditions.push(inArray(produk.brand, options.brand));
        }

        if (options.gender && options.gender.length > 0) {
            conditions.push(inArray(produk.gender, options.gender));
        }

        if (options.priceRanges && options.priceRanges.length > 0) {
            const rangeConditions = options.priceRanges.map(range => {
                if (range === "Di bawah Rp 500rb") return sql`${priceColumn} < 500000`;
                if (range === "Rp 500rb - Rp 1.5jt") return sql`${priceColumn} BETWEEN 500000 AND 1500000`;
                if (range === "Di atas Rp 1.5jt") return sql`${priceColumn} > 1500000`;
                return null;
            }).filter((c): c is any => c !== null);

            if (rangeConditions.length > 0) {
                conditions.push(sql`(${sql.join(rangeConditions, sql` OR `)})`);
            }
        }

        if (options.search) {
            const keywords = options.search.trim().split(/\s+/).filter(Boolean);
            if (keywords.length > 0) {
                const keywordConditions = keywords.map(kw => {
                    const term = `%${kw}%`;
                    return or(
                        like(produk.namaProduk, term),
                        like(produk.produkId, term)
                    );
                });
                conditions.push(and(...keywordConditions));
            }
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // --- Execute Queries in Parallel ---
        const [totalResult, data] = await Promise.all([
            // 1. Get Total Count
            db.select({ count: sql<number>`COUNT(DISTINCT ${produk.produkId})` })
                .from(produk)
                .leftJoin(produkDetail, eq(produk.produkId, produkDetail.produkId))
                .leftJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna)))
                .where(whereClause),

            // 2. Get Paginated Data
            db.select({
                produkId: produk.produkId,
                namaProduk: produk.namaProduk,
                kategori: produk.kategori,
                gambar: produk.gambar,
                deskripsi: produk.deskripsi,
                tglRilis: produk.tglRilis,
                minPrice: min(priceColumn),
                maxPrice: max(priceColumn),
                baseMinPrice: min(produkDetail.hargaJual),
                baseMaxPrice: max(produkDetail.hargaJual),
                totalStock: sql<number>`(SELECT COALESCE(SUM(stok_normal), 0) FROM produkdetail WHERE produk_id = produk.produk_id)`,
                isOnline: produk.isOnline,
                isAktif: produk.isAktif,
                isHighlighted: produk.isHighlighted,
                produkPreorder: produk.produkPreorder,
                brand: produk.brand,
                gender: produk.gender,
                colors: sql<string>`GROUP_CONCAT(DISTINCT CONCAT(COALESCE(${warna.warna}, ${produkDetail.warnaId}), '|', COALESCE(${warna.kodeWarna}, '#cccccc')) SEPARATOR ',')`,
                flashSaleId: sql<number>`(SELECT fs.id FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = produk.produk_id AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                preOrderId: sql<number>`(SELECT po.pre_order_id FROM pre_order po INNER JOIN pre_order_detail pod ON po.pre_order_id = pod.pre_order_id WHERE po.is_aktif = 1 AND pod.produk_id = produk.produk_id AND po.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                flashSaleDiscount: sql<number>`(SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1)`,
            })
            .from(produk)
            .leftJoin(produkDetail, eq(produk.produkId, produkDetail.produkId))
            .leftJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna)))
            .where(whereClause)
            .groupBy(produk.produkId)
            .orderBy(orderBy || sql`SUM(${produkDetail.stokNormal}) DESC`)
            .limit(limit)
            .offset(offset)
        ]);

        return {
            data: ProductService.processProductData(data),
            total: Number(totalResult[0]?.count || 0)
        };
    }

    /**
     * Get single product detail with stats, variants, and related products.
     * Fetches directly from the database without caching.
     */
    static async getProductDetail(id: string, kategoriId: number) {
        return fetchProductDetailInternal(id, kategoriId);
    }

    /**
     * Get real-time stock and price for sync.
     * Note: This is NOT cached as it needs to be real-time.
     */
    static async getRealtimeSync(id: string, kategoriId: number) {
        const priceColumn = CustomerService.getPriceColumn(kategoriId);
        const now = getJakartaDate();

        const [priceStats, details, flashSaleData] = await Promise.all([
            db.select({
                minPrice: min(priceColumn),
                maxPrice: max(priceColumn),
                baseMinPrice: min(produkDetail.hargaJual),
                baseMaxPrice: max(produkDetail.hargaJual),
                totalStock: sql<number>`COALESCE(SUM(${produkDetail.stokNormal}), 0)`,
            }).from(produkDetail).where(eq(produkDetail.produkId, id)),
            db.select({
                color: sql<string>`COALESCE(${warna.warna}, ${produkDetail.warnaId})`,
                colorValue: sql<string>`COALESCE(${warna.kodeWarna}, '#cccccc')`,
                size: produkDetail.size,
                variant: produkDetail.variant,
                stock: produkDetail.stokNormal,
                price: priceColumn,
                basePrice: produkDetail.hargaJual,
                image: produkDetail.gambar,
                colorId: produkDetail.warnaId,
            }).from(produkDetail).leftJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna))).where(eq(produkDetail.produkId, id)),
             db.select({
                flashSaleId: sql<number>`(SELECT fs.id FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = ${id} AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                flashSaleEndTime: sql<string>`(SELECT DATE_FORMAT(fs.waktu_selesai, '%Y-%m-%d %H:%i:%s') FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = ${id} AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                flashSaleDiscount: sql<number>`(SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1)`,
            }).from(produk).where(eq(produk.produkId, id)).limit(1)
        ]);

        if (priceStats.length === 0) return null;

        const stats = priceStats[0];
        const isOnFlashSale = !!flashSaleData[0]?.flashSaleId;
        const flashSaleDiscount = flashSaleData[0]?.flashSaleDiscount || 0;

        const finalMinPrice = isOnFlashSale ? Number(stats.baseMinPrice) - (Number(stats.baseMinPrice) * (Number(flashSaleDiscount) / 100)) : Number(stats.minPrice);
        const finalMaxPrice = isOnFlashSale ? Number(stats.baseMaxPrice) - (Number(stats.baseMaxPrice) * (Number(flashSaleDiscount) / 100)) : Number(stats.maxPrice);

        return {
            stats: {
                totalStock: Number(stats.totalStock || 0),
                minPrice: Number(stats.minPrice || 0),
                maxPrice: Number(stats.maxPrice || 0),
                baseMinPrice: Number(stats.baseMinPrice || 0),
                baseMaxPrice: Number(stats.baseMaxPrice || 0),
                finalMinPrice,
                finalMaxPrice,
                isOnFlashSale,
                flashSaleEndTime: flashSaleData[0]?.flashSaleEndTime || null,
                discountPercentage: isOnFlashSale ? Number(flashSaleDiscount || 0) : 0,
            },
            variants: details.map(d => {
                const dPrice = isOnFlashSale ? Number(d.basePrice) - (Number(d.basePrice) * (Number(flashSaleDiscount) / 100)) : d.price;
                return { ...d, price: dPrice };
            })
        };
    }

    /**
     * Get all available colors.
     */
    static async getColors() {
        return await db.select().from(warna);
    }

    /**
     * Get all available sizes.
     */
    static async getSizes() {
        return await db.select().from(size);
    }

    /**
     * Process product data to calculate final prices and commissions.
     */
    public static processProductData(data: any[]) {
        return data.map((p: any) => {
            const isOnFlashSale = !!p.flashSaleId;
            const isOnPreOrder = !!p.preOrderId;
            const flashDiscountValue = isOnFlashSale ? Number(p.flashSaleDiscount || 0) : 0;

            const finalMinPrice = isOnFlashSale
                ? Number(p.baseMinPrice) - (Number(p.baseMinPrice) * (flashDiscountValue / 100))
                : p.minPrice;

            const finalMaxPrice = isOnFlashSale
                ? Number(p.baseMaxPrice) - (Number(p.baseMaxPrice) * (flashDiscountValue / 100))
                : p.maxPrice;

            const commissionMin = Number(p.baseMinPrice) - Number(finalMinPrice);
            const commissionMax = Number(p.baseMaxPrice) - Number(finalMaxPrice);

            return {
                ...p,
                isOnFlashSale,
                isOnPreOrder,
                finalMinPrice,
                finalMaxPrice,
                commissionMin,
                commissionMax,
                discountPercentage: flashDiscountValue,
                totalStock: Number(p.totalStock || 0),
                hasCommission: commissionMin > 0 || commissionMax > 0
            };
        });
    }
}
