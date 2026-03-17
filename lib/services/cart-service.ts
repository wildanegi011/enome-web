import { db } from "@/lib/db";
import { keranjang, produk, warna, produkDetail, variant as variantTable, customer, flashSale } from "@/lib/db/schema";
import { eq, and, sql, or } from "drizzle-orm";
import { nowJakartaFull, parseJakarta } from "@/lib/date-utils";
import { CONFIG } from "@/lib/config";

export class CartService {
    /**
     * Get cart items for a specific user.
     */
    static async getCartItems(userId: number | string, itemIds?: number[]) {
        const dhms = nowJakartaFull();
        const now = parseJakarta(dhms);

        // 1. Get customer category for dynamic pricing
        const [customerData]: any = await db.select({ kategoriCustomerId: customer.kategoriCustomerId })
            .from(customer)
            .where(eq(customer.userId, Number(userId)))
            .limit(1);

        const kategoriId = customerData?.kategoriCustomerId || CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID;
        const priceColumnName = CONFIG.PRICE_COLUMNS[kategoriId] || CONFIG.PRICE_COLUMNS[CONFIG.DEFAULT_KATEGORI_CUSTOMER_ID];

        const conditions = [
            eq(keranjang.custId, Number(userId)),
            eq(keranjang.isDeleted, 0)
        ];

        if (itemIds && itemIds.length > 0) {
            const inArray = (await import("drizzle-orm")).inArray;
            conditions.push(inArray(keranjang.id, itemIds));
        }

        const rawItems = await db.select({
            id: keranjang.id,
            produkId: keranjang.produkId,
            namaProduk: produk.namaProduk,
            warna: keranjang.warna,
            warnaName: warna.warna,
            size: keranjang.size,
            variant: keranjang.variant,
            qty: keranjang.qtyProduk,
            storedHarga: keranjang.hargaPoduk,
            normalHarga: sql<number>`MAX(COALESCE(${(produkDetail as any)[priceColumnName]}, ${produkDetail.hargaJual}))`.as('normalHarga'),
            gambar: sql<string>`COALESCE(
                (SELECT CONCAT('produk/', pi2.gambar) 
                 FROM produk_image pi2 
                 LEFT JOIN warna w3 ON (pi2.warna = w3.warna OR pi2.warna = w3.warna_id)
                 WHERE pi2.produk_id = ${keranjang.produkId} 
                   AND (pi2.warna = ${keranjang.warna} OR w3.warna_id = ${keranjang.warna} OR w3.warna = ${keranjang.warna})
                 ORDER BY pi2.id ASC
                 LIMIT 1),
                CONCAT('produk_utama/', ${produk.gambar})
            )`.as('gambar'),
            keterangan: keranjang.keterangan,
            isFlashsale: keranjang.isFlashsale,
            flashsaleId: keranjang.flashsaleId,
            flashsaleExpired: keranjang.flashsaleExpired,
            isPreorder: keranjang.isPreorder,
            isOnline: produk.isOnline,
            stock: sql<number>`MAX(${produkDetail.stokNormal})`.as('stock'),
            berat: sql<number>`MAX(${produkDetail.berat})`.as('berat'),
            fsIsAktif: flashSale.isAktif,
            fsWaktuSelesai: flashSale.waktuSelesai,
        })
            .from(keranjang)
            .leftJoin(produk, eq(keranjang.produkId, produk.produkId))
            .leftJoin(warna, or(eq(keranjang.warna, warna.warnaId), eq(keranjang.warna, warna.warna)))
            .leftJoin(produkDetail, and(
                eq(keranjang.produkId, produkDetail.produkId),
                sql`TRIM(${keranjang.size}) = TRIM(${produkDetail.size})`,
                // Match color by either ID or Name with TRIM
                or(
                    sql`TRIM(${keranjang.warna}) = TRIM(${produkDetail.warnaId})`,
                    sql`TRIM(${warna.warnaId}) = TRIM(${produkDetail.warnaId})`,
                    sql`TRIM(${warna.warna}) = TRIM(${produkDetail.warnaId})`
                ),
                // Match variant robustly, handle NULL and empty strings identically
                sql`(
                    TRIM(${produkDetail.variant}) = TRIM(${keranjang.variant}) 
                    OR (TRIM(${produkDetail.variant}) IS NULL AND (TRIM(${keranjang.variant}) IS NULL OR TRIM(${keranjang.variant}) = ''))
                    OR (TRIM(${keranjang.variant}) IS NULL AND (TRIM(${produkDetail.variant}) IS NULL OR TRIM(${produkDetail.variant}) = ''))
                    OR (TRIM(${produkDetail.variant}) = '' AND TRIM(${keranjang.variant}) = '')
                )`
            ))
            .leftJoin(flashSale, eq(keranjang.flashsaleId, sql`CAST(${flashSale.id} AS CHAR)`))
            .where(and(...conditions))
            .groupBy(keranjang.id)
            .orderBy(sql`${keranjang.createdAt} DESC`);

        // 2. Process items: check for expired flash sales and revert price if needed
        const items = rawItems.map(item => {
            // A flash sale is expired if:
            // 1. keranjang.is_flashsale is 1 AND
            // 2. (keranjang.flashsale_expired is passed OR FlashSale event is not active anymore)
            const isFlashSalePrice = item.isFlashsale === 1;
            let isExpired = false;

            if (isFlashSalePrice) {
                const cartExpired = item.flashsaleExpired ? parseJakarta(String(item.flashsaleExpired)) < now : false;
                const eventInactive = item.flashsaleId ? (item.fsIsAktif === 0) : false;
                const eventExpired = item.fsWaktuSelesai ? parseJakarta(String(item.fsWaktuSelesai)) < now : false;

                isExpired = cartExpired || eventInactive || eventExpired;
            }

            // 1. Ambil harga asli (normalHarga) yang terbaru sebagai prioritas
            // Jika tidak ada normalHarga, baru fallback ke storedHarga (harga saat masuk cart)
            let currentActivePrice = Number(item.normalHarga ?? item.storedHarga);
            
            // 2. Tentukan harga final
            let finalHarga = currentActivePrice;
            
            // Jika ini flash sale dan BELUM expired, kembali pakai harga flashsale (storedHarga)
            if (isFlashSalePrice && !isExpired) {
                finalHarga = Number(item.storedHarga);
            } 

            // 3. Deteksi apakah harga berubah (dari saat masuk keranjang vs harga aktual)
            const isPriceChanged = Number(item.storedHarga) !== finalHarga;

            console.log(`Cart debug - ID ${item.id}: stored=${item.storedHarga}, normal=${item.normalHarga}, final=${finalHarga}, changed=${isPriceChanged}`);

            return {
                ...item,
                harga: finalHarga,
                isFlashsaleExpired: isExpired ? 1 : 0,
                isPriceChanged: isPriceChanged,
                oldHarga: isPriceChanged ? Number(item.storedHarga) : null
            };
        });

        const totalAmount = items.reduce((acc: number, item: any) => acc + (Number(item.harga || 0) * Number(item.qty || 0)), 0);
        const totalQty = items.reduce((acc: number, item: any) => acc + Number(item.qty || 0), 0);

        return { items, totalAmount, totalQty };
    }

    /**
     * Get the count of active cart items for a user.
     */
    static async getCartCount(userId: number | string): Promise<number> {
        const cartCount: any = await db.select({ total: sql<number>`count(*)` })
            .from(keranjang)
            .where(and(eq(keranjang.custId, Number(userId)), eq(keranjang.isDeleted, 0)));

        return Number(cartCount[0]?.total || 0);
    }

    /**
     * Update a cart item.
     */
    static async updateCartItem(id: number, userId: number | string, data: { qtyProduk?: number; keterangan?: string; updatedAt: any }) {
        return await db.update(keranjang)
            .set(data)
            .where(and(eq(keranjang.id, id), eq(keranjang.custId, Number(userId))));
    }

    /**
     * Delete (soft delete) a cart item.
     */
    static async deleteCartItem(id: number, userId: number | string, updatedAt: any) {
        return await db.update(keranjang)
            .set({ isDeleted: 1, updatedAt })
            .where(and(eq(keranjang.id, id), eq(keranjang.custId, Number(userId))));
    }

    /**
     * Delete (soft delete) all cart items for a user.
     */
    static async deleteAllCartItems(userId: number | string, updatedAt: any) {
        return await db.update(keranjang)
            .set({ isDeleted: 1, updatedAt })
            .where(and(eq(keranjang.custId, Number(userId)), eq(keranjang.isDeleted, 0)));
    }
}
