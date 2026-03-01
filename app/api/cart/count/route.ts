import { NextRequest, NextResponse } from "next/server";
import { withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CartService } from "@/lib/services/cart-service";

/**
 * Mengambil jumlah total item (baris unik) di keranjang user.
 * Digunakan untuk badge angka di ikon keranjang pada Navbar.
 *
 * @auth optional (anonymous → total: 0)
 * @method GET
 * @response 200 — { total: number }
 */
export const GET = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.debug("API Request: GET /api/cart/count");
    try {
        if (!session) {
            return NextResponse.json({ total: 0 });
        }

        const userId = session.user.id;
        const totalItems = await CartService.getCartCount(userId);

        return NextResponse.json({
            total: totalItems
        });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ total: 0 }, { status: 500 });
    }
});
