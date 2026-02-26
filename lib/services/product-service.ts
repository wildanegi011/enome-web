import { db } from "@/lib/db";
import { produk, produkDetail, warna } from "@/lib/db/schema";
import { and, eq, sql, min, max } from "drizzle-orm";
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
                totalStock: sql<number>`(SELECT COALESCE(SUM(stok_normal), 0) FROM produkdetail WHERE produk_id = ${produk.produkId})`,
                isOnline: produk.isOnline,
                isAktif: produk.isAktif,
                isHighlighted: produk.isHighlighted,
                colors: sql<string>`GROUP_CONCAT(DISTINCT CONCAT(COALESCE(${warna.warna}, ${produkDetail.warnaId}), '|', COALESCE(${warna.kodeWarna}, '#cccccc')) SEPARATOR ',')`,
                flashSaleId: sql<number>`(SELECT fs.id FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id WHERE fs.is_aktif = 1 AND fsd.produk_id = ${produk.produkId} AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                preOrderId: sql<number>`(SELECT po.pre_order_id FROM pre_order po INNER JOIN pre_order_detail pod ON po.pre_order_id = pod.pre_order_id WHERE po.is_aktif = 1 AND pod.produk_id = ${produk.produkId} AND po.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1)`,
                flashSaleDiscount: sql<number>`(SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1)`,
            })
            .from(produk)
            .leftJoin(produkDetail, eq(produk.produkId, produkDetail.produkId))
            .leftJoin(warna, eq(produkDetail.warnaId, warna.warnaId))
            .groupBy(produk.produkId);

        if (where) {
            query = query.where(where) as any;
        }

        if (options.categories && options.categories.length > 0) {
            const categoryFilter = sql`${produk.kategori} IN ${options.categories}`;
            query = query.where(and(where, categoryFilter)) as any;
        }

        if (options.colors && options.colors.length > 0) {
            const colorFilter = sql`${warna.warna} IN ${options.colors}`;
            query = query.where(and(where, colorFilter)) as any;
        }

        if (options.sizes && options.sizes.length > 0) {
            const sizeFilter = sql`${produkDetail.size} IN ${options.sizes}`;
            query = query.where(and(where, sizeFilter)) as any;
        }

        // Price range filtering is complex because of final price calculations.
        // For simplicity and to match the previous in-memory logic, 
        // we'll filter based on the base min price in the DB layer if possible, 
        // or refine it in the processProductData.
        // But the user wants database integration, so we'll use WHERE on minPrice.
        if (options.priceRanges && options.priceRanges.length > 0) {
            const conditions = options.priceRanges.map(range => {
                if (range === "Under Rp 500k") return sql`${priceColumn} < 500000`;
                if (range === "Rp 500k - Rp 1.5M") return sql`${priceColumn} BETWEEN 500000 AND 1500000`;
                if (range === "Above Rp 1.5M") return sql`${priceColumn} > 1500000`;
                return null;
            }).filter((c): c is any => c !== null);

            if (conditions.length > 0) {
                const priceFilter = sql`(${sql.join(conditions, sql` OR `)})`;
                query = query.where(and(where, priceFilter)) as any;
            }
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

            const finalMinPrice = isOnFlashSale
                ? Number(p.baseMinPrice) - (Number(p.baseMinPrice) * (Number(p.flashSaleDiscount || 0) / 100))
                : p.minPrice;

            const finalMaxPrice = isOnFlashSale
                ? Number(p.baseMaxPrice) - (Number(p.baseMaxPrice) * (Number(p.flashSaleDiscount || 0) / 100))
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
                totalStock: Number(p.totalStock || 0),
                hasCommission: commissionMin > 0 || commissionMax > 0
            };
        });
    }
}
