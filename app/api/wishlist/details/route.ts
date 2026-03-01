import { db } from "@/lib/db";
import { keranjangLove, produk } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Mengambil wishlist items beserta detail produk lengkap.
 * Termasuk nama produk, gambar, harga, kategori, warna, dan stok.
 *
 * @auth optional (anonymous → items kosong)
 * @method GET
 * @response 200 — { items: WishlistItem[] }
 *   WishlistItem: { wishlist_id, produk_id, nama_produk, kategori, gambar, min_price, max_price, total_stock, colors }
 * @response 500 — { error: "Gagal mengambil wishlist" }
 */
export const GET = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/wishlist/details");
    try {
        if (!session) {
            return NextResponse.json({ items: [] });
        }

        const custId = Number(session.user.id);

        const items = await db.execute(sql`
            SELECT 
                MAX(kl.id) as wishlist_id,
                kl.produk_id,
                MAX(kl.created_at) as created_at,
                p.nama_produk,
                p.kategori,
                p.gambar,
                p.isaktif,
                p.is_online,
                (SELECT MIN(pd.harga_jual) FROM produkdetail pd WHERE pd.produk_id = p.produk_id AND pd.stok_normal > 0) as min_price,
                (SELECT MAX(pd.harga_jual) FROM produkdetail pd WHERE pd.produk_id = p.produk_id AND pd.stok_normal > 0) as max_price,
                (SELECT SUM(pd.stok_normal) FROM produkdetail pd WHERE pd.produk_id = p.produk_id) as total_stock,
                (SELECT GROUP_CONCAT(DISTINCT CONCAT(w.warna, '|', COALESCE(w.kode_warna, '#CCCCCC')) SEPARATOR ',')
                 FROM produkdetail pd 
                 LEFT JOIN warna w ON pd.warna = w.warna_id 
                 WHERE pd.produk_id = p.produk_id AND pd.stok_normal > 0) as colors
            FROM keranjang_love kl
            INNER JOIN produk p ON kl.produk_id = p.produk_id
            WHERE kl.cust_id = ${custId}
              AND kl.is_deleted = 0
            GROUP BY kl.produk_id, p.nama_produk, p.kategori, p.gambar, p.isaktif, p.is_online
            ORDER BY MAX(kl.created_at) DESC
        `);

        logger.info("API Response: 200 /api/wishlist/details", { count: (items as any[])[0]?.length || 0 });
        return NextResponse.json({ items: (items as any[])[0] || [] });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Gagal mengambil wishlist" }, { status: 500 });
    }
});
