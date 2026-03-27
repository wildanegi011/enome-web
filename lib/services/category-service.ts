import { db } from "@/lib/db";
import { kategoriProduk, produk } from "@/lib/db/schema";
import { and, eq, sql, inArray } from "drizzle-orm";

export interface CategoryQueryOptions {
    limit?: number;
    brand?: string[];
    gender?: string[];
}

export class CategoryService {
    static async getCategories(options: CategoryQueryOptions = {}) {
        const { limit, brand, gender } = options;

        // Base query - fetch from kategoriProduk
        let query = db.select({
            kategoriId: kategoriProduk.kategoriId,
            kategori: kategoriProduk.kategori,
            gambarKategori: kategoriProduk.gambarKategori,
            icon: kategoriProduk.icon,
        }).from(kategoriProduk);

        // If filtering by brand or gender, we only want categories that have matching products
        if ((brand && brand.length > 0) || (gender && gender.length > 0)) {
            const conditions: any[] = [];
            if (brand && brand.length > 0) {
                conditions.push(inArray(produk.brand, brand));
            }
            if (gender && gender.length > 0) {
                conditions.push(inArray(produk.gender, gender));
            }
            conditions.push(eq(produk.isOnline, 1));

            // Subquery to get unique category names for matching products
            const matchingCategoriesQuery = db.select({
                name: produk.kategori
            })
                .from(produk)
                .where(and(...conditions))
                .groupBy(produk.kategori);

            const matchingCategories = await matchingCategoriesQuery;
            const categoryNames = matchingCategories.map(c => c.name).filter(Boolean);

            if (categoryNames.length > 0) {
                query = query.where(inArray(kategoriProduk.kategori, categoryNames)) as any;
            } else {
                // No categories match these brand/gender filters
                return [];
            }
        }

        if (limit) {
            query = query.limit(limit) as any;
        }

        return await query;
    }
}
