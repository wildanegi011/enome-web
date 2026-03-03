import { db } from "@/lib/db";
import { keranjangLove, produk } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { withOptionalAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";
import { getJakartaDate } from "@/lib/date-utils";

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
        const kategoriId = await CustomerService.getKategoriId(custId);
        const priceColumn = CustomerService.getPriceColumn(kategoriId);
        const now = getJakartaDate();

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
                (SELECT MIN(${priceColumn}) FROM produkdetail pd WHERE pd.produk_id = p.produk_id) as min_price,
                (SELECT MAX(${priceColumn}) FROM produkdetail pd WHERE pd.produk_id = p.produk_id) as max_price,
                (SELECT MIN(pd.harga_jual) FROM produkdetail pd WHERE pd.produk_id = p.produk_id) as base_min_price,
                (SELECT MAX(pd.harga_jual) FROM produkdetail pd WHERE pd.produk_id = p.produk_id) as base_max_price,
                (SELECT SUM(pd.stok_normal) FROM produkdetail pd WHERE pd.produk_id = p.produk_id) as total_stock,
                (SELECT GROUP_CONCAT(DISTINCT CONCAT(w.warna, '|', COALESCE(w.kode_warna, '#CCCCCC')) SEPARATOR ',')
                 FROM produkdetail pd 
                 LEFT JOIN warna w ON pd.warna = w.warna_id 
                 WHERE pd.produk_id = p.produk_id AND pd.stok_normal > 0) as colors,
                (SELECT fs.id FROM flash_sale fs INNER JOIN flash_sale_detail fsd ON fs.id = fsd.flash_sale_id 
                 WHERE fs.is_aktif = 1 AND fsd.produk_id = p.produk_id AND ${now} BETWEEN fs.waktu_mulai AND fs.waktu_selesai 
                 AND fs.customer_kategori_id LIKE ${"%" + kategoriId + "%"} LIMIT 1) as flash_sale_id,
                (SELECT ck.diskon_flash_sale FROM customer_kategori ck WHERE ck.id = ${kategoriId} LIMIT 1) as flash_sale_discount
            FROM keranjang_love kl
            INNER JOIN produk p ON kl.produk_id = p.produk_id
            WHERE kl.cust_id = ${custId}
              AND kl.is_deleted = 0
            GROUP BY kl.produk_id, p.nama_produk, p.kategori, p.gambar, p.isaktif, p.is_online
            ORDER BY MAX(kl.created_at) DESC
        `);

        // Map items to include final prices and boolean status
        const processedItems = (items as any[])[0]?.map((item: any) => {
            const isOnFlashSale = !!item.flash_sale_id;
            const discount = isOnFlashSale ? Number(item.flash_sale_discount || 0) : 0;

            const finalMinPrice = isOnFlashSale
                ? Number(item.base_min_price) - (Number(item.base_min_price) * (discount / 100))
                : item.min_price;

            const finalMaxPrice = isOnFlashSale
                ? Number(item.base_max_price) - (Number(item.base_max_price) * (discount / 100))
                : item.max_price;

            return {
                ...item,
                is_on_flash_sale: isOnFlashSale,
                flash_sale_discount: discount,
                final_min_price: finalMinPrice,
                final_max_price: finalMaxPrice
            };
        }) || [];

        logger.info("API Response: 200 /api/wishlist/details", { count: processedItems.length });
        return NextResponse.json({ items: processedItems });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Gagal mengambil wishlist" }, { status: 500 });
    }
});
