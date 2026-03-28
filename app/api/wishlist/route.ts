import { NextRequest, NextResponse } from "next/server";
import { withAuth, withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { WishlistService } from "@/lib/services/wishlist-service";

export const GET = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/wishlist");
    try {
        if (!session) {
            return NextResponse.json({ items: [] });
        }

        const custId = Number(session.user.id);
        const items = await WishlistService.getWishlist(custId);

        logger.info("API Response: 200 /api/wishlist", { count: items.length });
        return NextResponse.json({ items });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Gagal mengambil wishlist" }, { status: 500 });
    }
});

export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: POST /api/wishlist");
    try {
        const custId = Number(session.user.id);
        const { produkId } = await request.json();

        if (!produkId) {
            return NextResponse.json({ error: "produkId is required" }, { status: 400 });
        }

        const result = await WishlistService.toggleWishlist(custId, produkId);

        logger.info(`Wishlist: ${result.action}`, { produkId, custId });
        return NextResponse.json(result);
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Gagal update wishlist" }, { status: 500 });
    }
});
