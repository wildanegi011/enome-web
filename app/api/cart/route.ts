import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keranjang, produk, warna, produkDetail } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";

/**
 * Handler untuk mengambil isi keranjang belanja user.
 * Melakukan join dengan produk, warna, dan detail produk untuk mendapatkan data lengkap (stok, harga, gambar).
 * Menghitung total nominal dan total kuantitas barang di keranjang.
 */
export async function GET(request: NextRequest) {
    logger.info("API Request: GET /api/cart");
    try {
        const session = await getSession();
        if (!session) {
            logger.info("Cart Check: Anonymous cart requested (empty)");
            return NextResponse.json({ items: [], totalAmount: 0, totalQty: 0 });
        }

        const userId = session.user.id;

        // Query item keranjang yang belum dihapus (isDeleted = 0)
        const cartItems = await db.select({
            id: keranjang.id,
            produkId: keranjang.produkId,
            namaProduk: produk.namaProduk,
            warnaId: keranjang.warna,
            warnaName: warna.warna,
            size: keranjang.size,
            qty: keranjang.qtyProduk,
            harga: keranjang.hargaPoduk,
            gambar: keranjang.gambarProduk,
            keterangan: keranjang.keterangan,
            isFlashsale: keranjang.isFlashsale,
            isPreorder: keranjang.isPreorder,
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
            .where(and(eq(keranjang.custId, userId), eq(keranjang.isDeleted, 0)))
            .orderBy(sql`${keranjang.createdAt} DESC`);

        // Menghitung total belanja
        const totalAmount = cartItems.reduce((acc, item) => acc + (Number(item.harga || 0) * Number(item.qty || 0)), 0);
        const totalQty = cartItems.reduce((acc, item) => acc + Number(item.qty || 0), 0);

        logger.info("Cart Check: Success", { userId, itemCount: cartItems.length, totalAmount });
        return NextResponse.json({
            items: cartItems,
            totalAmount,
            totalQty
        });

    } catch (error: any) {
        logger.error("API Error: /api/cart", { error: error.message });
        return NextResponse.json({ items: [], totalAmount: 0, totalQty: 0, error: error.message }, { status: 500 });
    }
}

