import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";
import { CONFIG } from "@/lib/config";

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
        const statusOrder = searchParams.get("statusOrder");
        const statusTagihan = searchParams.get("statusTagihan");
        const search = searchParams.get("search");

        const userId = session.user.id;
        logger.debug("Order History: Filters applied", { userId, page, limit, statusOrder, search });

        // Membangun kondisi WHERE secara dinamis
        const whereConditions = [eq(orders.userId, userId.toString())];

        if (startDate) {
            whereConditions.push(gte(orders.tglOrder, sql`${startDate}`));
        }
        if (endDate) {
            whereConditions.push(lte(orders.tglOrder, sql`${endDate}`));
        }
        if (statusOrder && statusOrder !== "ALL") {
            whereConditions.push(eq(orders.statusOrder, statusOrder));
        }
        if (statusTagihan && statusTagihan !== "ALL") {
            whereConditions.push(eq(orders.statusTagihan, statusTagihan));
        }
        if (search) {
            whereConditions.push(sql`${orders.orderId} LIKE ${`%${search}%`}`);
        }

        const finalWhere = and(...whereConditions);

        // Ambil data order dengan pagination dan sorting terbaru ke terlama
        const userOrders = await db.select()
            .from(orders)
            .where(finalWhere)
            .orderBy(desc(orders.tglOrder))
            .limit(limit)
            .offset(offset);

        // Hitung total data untuk keperluan pagination di frontend
        const [totalCount] = await db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(finalWhere);

        logger.info("Order History: Fetch success", { userId, count: userOrders.length, total: totalCount?.count });
        return NextResponse.json({
            orders: userOrders,
            total: totalCount?.count || 0,
            page,
            limit
        });
    } catch (error: any) {
        logger.error("API Error: /api/user/orders", { error: error.message });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}


