import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, statusOrder as statusOrderSchema } from "@/lib/db/schema";
import { eq, desc, sql, and, gte, lte, or, ne, notInArray, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { CustomerService } from "@/lib/services/customer-service";

/**
 * Handler untuk mengambil daftar pesanan (order history) milik user.
 * Mendukung filter berdasarkan rentang tanggal, status order, status tagihan, dan pencarian Order ID.
 * Menggunakan pagination (page & limit).
 */
export async function GET(request: NextRequest) {
    logger.info("API Request: GET /api/user/orders");
    try {
        const session = await getSession();
        if (!session) {
            logger.warn("Order History: Unauthorized access attempt");
            return NextResponse.json({ message: "login" }, { status: 401 });
        }

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
            // Additional details for card UI
            firstItemName: sql<string>`(SELECT p.nama_produk FROM orderdetail od JOIN produk p ON od.produk_id = p.produk_id WHERE od.order_id = orders.order_id LIMIT 1)`,
            firstItemImage: sql<string>`(SELECT p.gambar FROM orderdetail od JOIN produk p ON od.produk_id = p.produk_id WHERE od.order_id = orders.order_id LIMIT 1)`,
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
            orders: userOrders,
            total: totalCount?.count || 0,
            page,
            limit,
            tabs: dynamicTabs
        });
    } catch (error: any) {
        logger.error("API Error: /api/user/orders", { error: error.message });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}


