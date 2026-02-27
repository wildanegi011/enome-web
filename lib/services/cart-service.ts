import { db } from "@/lib/db";
import { keranjang, produk, warna, produkDetail } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export class CartService {
    /**
     * Get cart items for a specific user.
     */
    static async getCartItems(userId: number | string) {
        const items = await db.select({
            id: keranjang.id,
            produkId: keranjang.produkId,
            namaProduk: produk.namaProduk,
            warna: keranjang.warna,
            warnaName: warna.warna,
            size: keranjang.size,
            qty: keranjang.qtyProduk,
            harga: keranjang.hargaPoduk,
            gambar: sql<string>`COALESCE(${keranjang.gambarProduk}, ${produk.gambar})`.as('gambar'),
            keterangan: keranjang.keterangan,
            isFlashsale: keranjang.isFlashsale,
            isPreorder: keranjang.isPreorder,
            isOnline: produk.isOnline,
            stock: produkDetail.stokNormal,
            berat: produkDetail.berat,
        })
            .from(keranjang)
            .leftJoin(produk, eq(keranjang.produkId, produk.produkId))
            .leftJoin(warna, eq(keranjang.warna, warna.warnaId))
            .leftJoin(produkDetail, and(
                eq(keranjang.produkId, produkDetail.produkId),
                eq(keranjang.warna, produkDetail.warnaId),
                eq(keranjang.size, produkDetail.size)
            ))
            .where(and(eq(keranjang.custId, Number(userId)), eq(keranjang.isDeleted, 0)))
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
}
