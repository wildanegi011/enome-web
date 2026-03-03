import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";
import { UserService } from "@/lib/services/user-service";

/**
 * Mengambil histori transaksi wallet milik user.
 *
 * @auth required
 * @method GET
 * @response 200 — { history: Array }
 */
export const GET = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/user/wallet/history");
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10")));
        const offset = (page - 1) * limit;

        const userId = session.user.id;
        const custId = await CustomerService.getCustId(userId);

        if (!custId) {
            return NextResponse.json({
                history: [],
                metadata: { total: 0, totalPages: 0, currentPage: page, limit }
            });
        }

        const { history, total } = await UserService.getWalletHistory(custId, limit, offset);
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            history,
            metadata: {
                total,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/user/wallet/history" });
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
