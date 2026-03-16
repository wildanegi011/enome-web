import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, statusOrder as statusOrderSchema } from "@/lib/db/schema";
import { eq, desc, sql, and, gte, lte, or, ne, notInArray, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { CustomerService } from "@/lib/services/customer-service";
import { formatJakartaISO } from "@/lib/date-utils";

/**
 * Mengambil daftar pesanan (order history) milik user.
 * Mendukung filter (tanggal, status, pencarian) dan pagination.
 *
 * @auth required
 * @method GET
 * @query {{ page?, limit?, startDate?, endDate?, statusOrder?, statusTagihan?, search? }}
 * @response 200 — { orders: Order[], total: number, page: number, limit: number, tabs: Tab[] }
 * @response 401 — { message: "login" }
 * @response 500 — { message: "error", error: "Terjadi kesalahan sistem" }
 */
export const GET = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/user/orders");
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || String(CONFIG.PAGINATION.DEFAULT_PAGE));
        const limit = parseInt(searchParams.get("limit") || String(CONFIG.PAGINATION.DEFAULT_LIMIT));
        const offset = (page - 1) * limit;

        // Filter dari query parameters
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const filterStatusOrder = searchParams.get("statusOrder");
        const statusTagihan = searchParams.get("statusTagihan");
        const search = searchParams.get("search");

        const userId = session.user.id;
        const custId = await CustomerService.getCustId(userId);
        logger.debug("Order History: Filters applied", { userId, custId, page, limit, filterStatusOrder, search });

        // Membangun kondisi WHERE secara dinamis
        const userCondition = custId
            ? or(eq(orders.userId, userId.toString()), eq(orders.userId, custId))
            : eq(orders.userId, userId.toString());

        const whereConditions = [
            userCondition as any,
            notInArray(orders.statusOrder, CONFIG.ORDER_STATUS.EXCLUDED)
        ];

        if (startDate) {
            whereConditions.push(gte(orders.tglOrder, sql`${startDate}`));
        }
        if (endDate) {
            whereConditions.push(lte(orders.tglOrder, sql`${endDate}`));
        }
        if (filterStatusOrder && filterStatusOrder !== "ALL") {
            whereConditions.push(eq(orders.statusOrder, filterStatusOrder));
        }
        if (statusTagihan && statusTagihan !== "ALL") {
            whereConditions.push(eq(orders.statusTagihan, statusTagihan));
        }
        if (search) {
            const searchPattern = `%${search}%`;
            whereConditions.push(or(
                sql`${orders.orderId} LIKE ${searchPattern}`,
                sql`EXISTS (
                    SELECT 1 FROM orderdetail od 
                    JOIN produk p ON od.produk_id = p.produk_id 
                    WHERE od.order_id = ${orders.orderId} 
                    AND p.nama_produk LIKE ${searchPattern}
                )`
            ));
        }

        const finalWhere = and(...whereConditions);

        // Ambil data order dengan pagination dan sorting terbaru ke terlama
        const userOrders = await db.select({
            orderId: orders.orderId,
            tglOrder: orders.tglOrder,
            statusOrder: orders.statusOrder,
            statusTagihan: orders.statusTagihan,
            totalTagihan: orders.totalTagihan,
            metodebayar: orders.metodebayar,
            totalOrder: orders.totalOrder,
            updatedAt: orders.updatedAt,
            noResi: orders.noResi,
            ekspedisi: orders.ekspedisi,
            teleponPenerima: orders.teleponPenerima,
            // Additional details for card UI
            firstItemName: sql<string>`(SELECT p.nama_produk FROM orderdetail od JOIN produk p ON od.produk_id = p.produk_id WHERE od.order_id = orders.order_id LIMIT 1)`,
            firstItemImage: sql<string>`(
                SELECT COALESCE(
                    (SELECT CONCAT('produk/', pi2.gambar) 
                     FROM produk_image pi2 
                     JOIN orderdetail od2 ON (pi2.produk_id = od2.produk_id)
                     LEFT JOIN warna w3 ON (pi2.warna = w3.warna OR pi2.warna = w3.warna_id)
                     WHERE od2.order_id = orders.order_id 
                       AND (pi2.warna = od2.warna OR w3.warna_id = od2.warna OR w3.warna = od2.warna)
                     ORDER BY pi2.id ASC
                     LIMIT 1),
                    (SELECT CONCAT('produk_utama/', p2.gambar)
                     FROM orderdetail od2
                     JOIN produk p2 ON od2.produk_id = p2.produk_id
                     WHERE od2.order_id = orders.order_id
                     LIMIT 1)
                )
            )`,



            firstItemSize: sql<string>`(SELECT od.ukuran FROM orderdetail od WHERE od.order_id = orders.order_id LIMIT 1)`,
            itemCount: sql<number>`(SELECT SUM(od.qty) FROM orderdetail od WHERE od.order_id = orders.order_id)`
        })
            .from(orders)
            .where(finalWhere)
            .orderBy(desc(orders.updatedAt))
            .limit(limit)
            .offset(offset);

        // Hitung total data untuk keperluan pagination di frontend
        const [totalCount] = await db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(finalWhere);

        logger.info("Order History: Fetch success", { userId, count: userOrders.length, total: totalCount?.count });
        // Ambil data tab status dinamis dari database
        const statusData = await db.select({
            value: statusOrderSchema.statusOrderId,
            label: statusOrderSchema.statusOrderEnduser
        }).from(statusOrderSchema);

        const dynamicTabs = [
            { label: "Semua", value: "ALL" },
            ...CONFIG.ORDER_STATUS.TABS.map(tab => ({
                label: tab.label,
                value: statusData.find(s => s.value === tab.dbStatus)?.value || tab.id
            }))
        ];

        return NextResponse.json({
            orders: userOrders.map(o => ({
                ...o,
                updatedAt: o.updatedAt ? formatJakartaISO(new Date(o.updatedAt)) : null
            })),
            total: totalCount?.count || 0,
            page,
            limit,
            tabs: dynamicTabs
        });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});


