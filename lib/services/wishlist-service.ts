import { db } from "@/lib/db";
import { keranjangLove, produk } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ActivityService } from "./activity-service";

export class WishlistService {
    /**
     * Get user's wishlist items (product IDs).
     */
    static async getWishlist(custId: number) {
        const items = await db
            .select({ produkId: keranjangLove.produkId })
            .from(keranjangLove)
            .innerJoin(produk, eq(keranjangLove.produkId, produk.produkId))
            .where(
                and(
                    eq(keranjangLove.custId, custId),
                    eq(keranjangLove.isDeleted, 0),
                    eq(produk.isOnline, 1)
                )
            );

        return [...new Set(items.map(i => i.produkId).filter(Boolean))];
    }

    /**
     * Toggle item in wishlist (add/remove).
     */
    static async toggleWishlist(custId: number, produkId: string) {
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
            // Remove from wishlist (soft delete)
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

            await ActivityService.log("Wishlist Remove", `User removed ${produkId} from wishlist`, custId);
            return { action: "removed", produkId };
        } else {
            // Add to wishlist
            await db.insert(keranjangLove).values({
                produkId,
                custId: custId,
                qtyProduk: 1,
                status: 0,
                keterangan: "",
                tipeDiskon: "allin",
                isDeleted: 0,
                createdBy: custId,
            });

            await ActivityService.log("Wishlist Add", `User added ${produkId} to wishlist`, custId);
            return { action: "added", produkId };
        }
    }
}
