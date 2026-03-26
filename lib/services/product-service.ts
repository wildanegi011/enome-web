import { db } from "@/lib/db";
import { produk, produkDetail, warna } from "@/lib/db/schema";
import { and, eq, sql, min, max, or, like } from "drizzle-orm";
import { getJakartaDate } from "@/lib/date-utils";
import { CustomerService } from "./customer-service";

export interface ProductQueryOptions {
    kategoriId: number;
    limit?: number;
    where?: any;
    orderBy?: any;
    categories?: string[];
    priceRanges?: string[];
    colors?: string[];
    sizes?: string[];
    search?: string;
}

export class ProductService {
    /**
     * Base query for fetching products with prices, stock, and status.
     */
    static async getProducts(options: ProductQueryOptions) {
        const { kategoriId, limit = 6, where, orderBy } = options;
        const priceColumn = CustomerService.getPriceColumn(kategoriId);
        const now = getJakartaDate();

        let query = db
            .select({
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
                colors: sql<string>`GROUP_CONCAT(DISTINCT CONCAT(COALESCE(${warna.warna}, ${produkDetail.warnaId}), '|', COALESCE(${warna.kodeWarna}, '#cccccc')) SEPARATOR ',')`,
                flashSaleId: sql<number>`(SELECT fs.id FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = produk.produk_id AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                preOrderId: sql<number>`(SELECT po.pre_order_id FROM pre_order po INNER JOIN pre_order_detail pod ON po.pre_order_id = pod.pre_order_id WHERE po.is_aktif = 1 AND pod.produk_id = produk.produk_id AND po.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                flashSaleDiscount: sql<number>`(SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1)`,
            })
            .from(produk)
            .leftJoin(produkDetail, eq(produk.produkId, produkDetail.produkId))
            .leftJoin(warna, or(eq(produkDetail.warnaId, warna.warnaId), eq(produkDetail.warnaId, warna.warna)))
            .groupBy(produk.produkId);

        const conditions: any[] = [];
        if (where) conditions.push(where);

        // Hide out-of-stock products unless it's a pre-order
        // conditions.push(sql`((SELECT COALESCE(SUM(stok_normal), 0) FROM produkdetail WHERE produk_id = ${produk.produkId}) > 0 OR ${produk.produkPreorder} = 1)`);

        if (options.categories && options.categories.length > 0) {
            conditions.push(sql`${produk.kategori} IN ${options.categories}`);
        }

        if (options.colors && options.colors.length > 0) {
            conditions.push(sql`${warna.warna} IN ${options.colors}`);
        }

        if (options.sizes && options.sizes.length > 0) {
            conditions.push(sql`${produkDetail.size} IN ${options.sizes}`);
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

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        if (orderBy) {
            query = query.orderBy(orderBy) as any;
        }


        if (limit) {
            query = query.limit(limit) as any;
        }

        const data = await query;
        return this.processProductData(data);
    }

    /**
     * Process product data to calculate final prices and commissions.
     */
    private static processProductData(data: any[]) {
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
