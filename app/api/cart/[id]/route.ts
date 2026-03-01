import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { getJakartaDate } from "@/lib/date-utils";
import { CartService } from "@/lib/services/cart-service";
import { db } from "@/lib/db";
import { keranjang, produkDetail, produk } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Update item keranjang (qty / catatan).
 * Melakukan validasi stok real-time sebelum update.
 *
 * @auth required
 * @method PATCH
 * @params {{ id: string }} (keranjang ID)
 * @body {{ qty?: number, notes?: string }}
 * @response 200 (success) — { message: "success" }
 * @response 200 (error)   — { message: "stok_empty"|"offline", desc: string }
 * @response 401 — { message: "login" }
 * @response 404 — { message: "not_found" }
 * @response 500 — { message: "error", error: "Terjadi kesalahan sistem" }
 */
export const PATCH = withAuth(async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    session: any
) => {
    const { params } = context;
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    logger.info("API Request: PATCH /api/cart/[id]", { id });

    try {

        const { qty, notes } = await request.json();

        if (isNaN(id)) {
            logger.warn("Cart Update: Invalid ID", { idStr });
            return NextResponse.json({ message: "bad_request" }, { status: 400 });
        }

        const result = await db.transaction(async (tx) => {
            const updateData: any = { updatedAt: getJakartaDate() };

            if (typeof qty === 'number' && qty >= 1) {
                // 1. Ambil detail item keranjang (LOCK)
                const [existingItemRows]: any = await tx.execute(sql`
                    SELECT 
                        produk_id as produkId, 
                        warna, 
                        size, 
                        cust_id as custId 
                    FROM keranjang 
                    WHERE id = ${id} AND cust_id = ${Number(session.user.id)} 
                    FOR UPDATE
                `);
                const existingItem = existingItemRows[0];

                if (!existingItem) {
                    return { error: "not_found", status: 404 };
                }

                const { produkId, warna, size } = existingItem;

                // 2. Ambil detail produk (LOCK)
                const [stockDataRows]: any = await tx.execute(sql`
                    SELECT 
                        pd.stok_normal as stokNormal, 
                        p.is_online as isOnline 
                    FROM produkdetail pd 
                    LEFT JOIN produk p ON p.produk_id = pd.produk_id 
                    WHERE pd.produk_id = ${produkId || ""} 
                    AND pd.warna = ${warna || ""} 
                    AND pd.size = ${size || ""} 
                    FOR UPDATE
                `);
                const stockData = stockDataRows[0];

                if (stockData) {
                    if (stockData.isOnline === 0) {
                        return { error: "offline", detail: "Maaf, produk ini sedang tidak tersedia atau toko kami sedang tutup.", status: 200 };
                    }

                    if ((stockData.stokNormal || 0) < qty) {
                        return { error: "stok_empty", detail: "Yah, stok produk tidak mencukupi untuk jumlah yang kamu inginkan nih.", status: 200 };
                    }
                }
                updateData.qtyProduk = qty;
            }

            if (typeof notes === 'string') updateData.keterangan = notes;

            // Melakukan update pada item keranjang
            await tx.update(keranjang)
                .set(updateData)
                .where(and(eq(keranjang.id, id), eq(keranjang.custId, Number(session.user.id))));

            return { success: true };
        });

        if (result.error) {
            if (result.status === 404) return NextResponse.json({ message: "not_found" }, { status: 404 });
            return NextResponse.json({ message: result.error, desc: result.detail });
        }

        logger.info("Cart Update: Success", { id, qty, notes });
        return NextResponse.json({ message: "success" });

    } catch (error: any) {
        apiLogger.error(request, error, { cartItemId: id });
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});

/**
 * Hapus item dari keranjang (soft delete).
 *
 * @auth required
 * @method DELETE
 * @params {{ id: string }} (keranjang ID)
 * @response 200 — { message: "success" }
 * @response 401 — { message: "login" }
 * @response 400 — { message: "bad_request" }
 * @response 500 — { message: "error", error: "Terjadi kesalahan sistem" }
 */
export const DELETE = withAuth(async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    session: any
) => {
    const { params } = context;
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    logger.info("API Request: DELETE /api/cart/[id]", { id });

    try {

        if (isNaN(id)) {
            logger.warn("Cart Delete: Invalid ID", { idStr });
            return NextResponse.json({ message: "bad_request" }, { status: 400 });
        }

        // Soft delete dengan mengubah flag isDeleted menjadi 1
        await CartService.deleteCartItem(id, session.user.id, getJakartaDate());

        logger.info("Cart Delete: Success", { id });
        return NextResponse.json({ message: "success" });

    } catch (error: any) {
        apiLogger.error(request, error, { cartItemId: id });
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});

