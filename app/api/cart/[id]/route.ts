import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";
import { getJakartaDate } from "@/lib/date-utils";
import { CartService } from "@/lib/services/cart-service";
import { db } from "@/lib/db";
import { keranjang, produkDetail, produk } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Handler untuk mengubah isi (PATCH) atau menghapus (DELETE) item dari keranjang.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    logger.info("API Request: PATCH /api/cart/[id]", { id });

    try {
        const session = await getSession();
        if (!session) {
            logger.warn("Cart Update: Unauthorized");
            return NextResponse.json({ message: "login" }, { status: 401 });
        }

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
        logger.error("API Error: /api/cart/[id] (PATCH)", { error: error.message, id });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    logger.info("API Request: DELETE /api/cart/[id]", { id });

    try {
        const session = await getSession();
        if (!session) {
            logger.warn("Cart Delete: Unauthorized");
            return NextResponse.json({ message: "login" }, { status: 401 });
        }

        if (isNaN(id)) {
            logger.warn("Cart Delete: Invalid ID", { idStr });
            return NextResponse.json({ message: "bad_request" }, { status: 400 });
        }

        // Soft delete dengan mengubah flag isDeleted menjadi 1
        await CartService.deleteCartItem(id, session.user.id, getJakartaDate());

        logger.info("Cart Delete: Success", { id });
        return NextResponse.json({ message: "success" });

    } catch (error: any) {
        logger.error("API Error: /api/cart/[id] (DELETE)", { error: error.message, id });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}

