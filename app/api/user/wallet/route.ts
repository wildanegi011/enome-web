import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";
import { UserService } from "@/lib/services/user-service";

/**
 * Mengambil saldo wallet terakhir milik user.
 * Mencari custId lalu mengambil record saldo terbaru dari tabel wallet.
 *
 * @auth required
 * @method GET
 * @response 200 — { balance: number }
 * @response 401 — { message: "login" }
 * @response 500 — { message: "error", error: "Terjadi kesalahan sistem" }
 */
export const GET = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/user/wallet");
    try {
        const userId = session.user.id;

        // Mencari custId yang berelasi dengan userId ini
        const custId = await CustomerService.getCustId(userId);

        if (!custId) {
            logger.info("Wallet Check: Customer profile not found, returning 0 balance");
            return NextResponse.json({ balance: 0 });
        }

        const balance = await UserService.getWalletBalance(custId);

        logger.info("Wallet Check: Balance fetched successfully", { userId, balance });
        return NextResponse.json({ balance });
    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/user/wallet" });
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});

