import { db } from "@/lib/db";
import { keranjangLove, produk } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Mengambil daftar produk_id yang ada di wishlist user.
 *
 * @auth optional (anonymous → items kosong)
 * @method GET
 * @response 200 — { items: string[] } (array of produkId)
 * @response 500 — { error: "Gagal mengambil wishlist" }
 */
export const GET = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/wishlist");
    try {
        if (!session) {
            return NextResponse.json({ items: [] });
        }

        const custId = Number(session.user.id);

        const items = await db
            .select({ produkId: keranjangLove.produkId })
            .from(keranjangLove)
            .innerJoin(produk, eq(keranjangLove.produkId, produk.produkId))
            .where(
                and(
                    eq(keranjangLove.custId, custId),
                    eq(keranjangLove.isDeleted, 0),
                    eq(produk.isAktif, 1)
                )
            );

        const produkIds = [...new Set(items.map(i => i.produkId).filter(Boolean))];

        logger.info("API Response: 200 /api/wishlist", { count: produkIds.length });
        return NextResponse.json({ items: produkIds });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Gagal mengambil wishlist" }, { status: 500 });
    }
});
/**
 * Toggle wishlist item (add/remove) berdasarkan produk_id.
 *
 * @auth required
 * @method POST
 * @body {{ produkId: string }}
 * @response 200 (added)   — { action: "added", produkId: string }
 * @response 200 (removed) — { action: "removed", produkId: string }
 * @response 401 — { error: "Unauthorized" }
 * @response 400 — { error: "produkId is required" }
 * @response 500 — { error: "Gagal update wishlist" }
 */
export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: POST /api/wishlist");
    try {
        const custId = Number(session.user.id);
        const body = await request.json();
        const { produkId, variant } = body;

        if (!produkId) {
            return NextResponse.json({ error: "produkId is required" }, { status: 400 });
        }

        // Check if item already exists and is not deleted
        const existing = await db
            .select()
            .from(keranjangLove)
            .where(
                and(
                    eq(keranjangLove.produkId, produkId),
                    eq(keranjangLove.custId, custId),
                    eq(keranjangLove.isDeleted, 0)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            // Remove from wishlist (soft delete, sama seperti Yii)
            await db
                .update(keranjangLove)
                .set({ isDeleted: 1 })
                .where(
                    and(
                        eq(keranjangLove.produkId, produkId),
                        eq(keranjangLove.custId, custId),
                        eq(keranjangLove.isDeleted, 0)
                    )
                );

            logger.info("Wishlist: Removed", { produkId, custId });
            return NextResponse.json({ action: "removed", produkId });
        } else {
            // Add to wishlist
            await db.insert(keranjangLove).values({
                produkId,
                variant: variant || null,
                custId: custId,
                qtyProduk: 1,
                hargaPoduk: 0,
                status: 0,
                keterangan: "",
                tipeDiskon: "allin",
                isDeleted: 0,
                createdBy: custId,
            });

            logger.info("Wishlist: Added", { produkId, custId });
            return NextResponse.json({ action: "added", produkId });
        }
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Gagal update wishlist" }, { status: 500 });
    }
});
