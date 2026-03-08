import { db } from "@/lib/db";
import { keranjang, produk, warna, produkDetail, variant as variantTable } from "@/lib/db/schema";
import { eq, and, sql, or } from "drizzle-orm";

export class CartService {
    /**
     * Get cart items for a specific user.
     */
    static async getCartItems(userId: number | string, itemIds?: number[]) {
        const conditions = [
            eq(keranjang.custId, Number(userId)),
            eq(keranjang.isDeleted, 0)
        ];

        if (itemIds && itemIds.length > 0) {
            const inArray = (await import("drizzle-orm")).inArray;
            conditions.push(inArray(keranjang.id, itemIds));
        }

        const items = await db.select({
            id: keranjang.id,
            produkId: keranjang.produkId,
            namaProduk: produk.namaProduk,
            warna: keranjang.warna,
            warnaName: warna.warna,
            size: keranjang.size,
            variant: keranjang.variant,
            qty: keranjang.qtyProduk,
            harga: keranjang.hargaPoduk,
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
            stock: produkDetail.stokNormal,
            berat: produkDetail.berat,
        })
            .from(keranjang)
            .leftJoin(produk, eq(keranjang.produkId, produk.produkId))
            .leftJoin(warna, or(eq(keranjang.warna, warna.warnaId), eq(keranjang.warna, warna.warna)))
            .leftJoin(produkDetail, and(
                eq(keranjang.produkId, produkDetail.produkId),
                eq(keranjang.warna, produkDetail.warnaId),
                eq(keranjang.size, produkDetail.size),
                sql`(${produkDetail.variant} = ${keranjang.variant} OR (${produkDetail.variant} IS NULL AND ${keranjang.variant} IS NULL))`
            ))
            .where(and(...conditions))
            .orderBy(sql`${keranjang.createdAt} DESC`);

        const totalAmount = items.reduce((acc, item) => acc + (Number(item.harga || 0) * Number(item.qty || 0)), 0);
        const totalQty = items.reduce((acc, item) => acc + Number(item.qty || 0), 0);

        return { items, totalAmount, totalQty };
    }

    /**
     * Get the count of active cart items for a user.
     */
    static async getCartCount(userId: number | string): Promise<number> {
        const cartCount = await db.select({ total: sql<number>`count(*)` })
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
