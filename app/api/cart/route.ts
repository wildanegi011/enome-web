import { NextRequest, NextResponse } from "next/server";
import { withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CartService } from "@/lib/services/cart-service";
import { getJakartaDate } from "@/lib/date-utils";

/**
 * Mengambil isi keranjang belanja user yang sedang login.
 * Melakukan join dengan produk untuk data lengkap (stok, harga, gambar).
 *
 * @auth optional (anonymous → keranjang kosong)
 * @method GET
 * @response 200 — { items: CartItem[], totalAmount: number, totalQty: number }
 * @response 500 — { items: [], totalAmount: 0, totalQty: 0, error: "Terjadi kesalahan sistem" }
 */
export const GET = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/cart");
    try {
        if (!session) {
            logger.info("Cart Check: Anonymous cart requested (empty)");
            return NextResponse.json({ items: [], totalAmount: 0, totalQty: 0 });
        }

        const userId = session.user.id;
        const result = await CartService.getCartItems(userId);

        logger.info("Cart Check: Success", { userId, itemCount: result.items.length, totalAmount: result.totalAmount });
        return NextResponse.json(result);

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ items: [], totalAmount: 0, totalQty: 0, error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});

/**
 * Mengosongkan seluruh isi keranjang belanja user (soft delete).
 *
 * @auth required
 * @method DELETE
 * @response 200 — { message: "success" }
 * @response 401 — { message: "login" }
 * @response 500 — { message: "error", error: "Terjadi kesalahan sistem" }
 */
export const DELETE = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: DELETE /api/cart");
    try {
        if (!session) {
            return NextResponse.json({ message: "login" }, { status: 401 });
        }

        const userId = session.user.id;
        await CartService.deleteAllCartItems(userId, getJakartaDate());

        logger.info("Cart Clear: Success", { userId });
        return NextResponse.json({ message: "success" });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
