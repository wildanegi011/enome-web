import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { CustomerService } from "@/lib/services/customer-service";
import { UserService } from "@/lib/services/user-service";
import { formatJakartaISO } from "@/lib/date-utils";
import { ConfigService } from "@/lib/services/config-service";

export const GET = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/user/orders");
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || String(CONFIG.PAGINATION.DEFAULT_PAGE));
        const limit = parseInt(searchParams.get("limit") || String(CONFIG.PAGINATION.DEFAULT_LIMIT));
        
        const startDate = searchParams.get("startDate") ?? undefined;
        const endDate = searchParams.get("endDate") ?? undefined;
        const statusOrder = searchParams.get("statusOrder") ?? undefined;
        const statusTagihan = searchParams.get("statusTagihan") ?? undefined;
        const search = searchParams.get("search") ?? undefined;

        const userId = session.user.id;
        const custId = await CustomerService.getCustId(userId);

        const result = await UserService.getOrders(userId, {
            page,
            limit,
            startDate,
            endDate,
            statusOrder,
            statusTagihan,
            search,
            custId: custId ?? undefined
        });

        return NextResponse.json({
            orders: result.orders.map(o => ({
                ...o,
                updatedAt: o.updatedAt ? formatJakartaISO(new Date(o.updatedAt)) : null
            })),
            total: result.total,
            page,
            limit,
            tabs: result.tabs,
            trackableCouriers: await ConfigService.getTrackableCouriers()
        });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});


