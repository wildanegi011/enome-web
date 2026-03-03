import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";
import { UserService } from "@/lib/services/user-service";

/**
 * Melakukan top-up saldo wallet.
 *
 * @auth required
 * @method POST
 * @body { amount: number, description?: string }
 */
export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: POST /api/user/wallet/topup");
    try {
        const body = await request.json();
        const { amount, description = "Top Up Wallet" } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ message: "error", error: "Nominal tidak valid" }, { status: 400 });
        }

        const userId = session.user.id;
        const custId = await CustomerService.getCustId(userId);

        if (!custId) {
            return NextResponse.json({ message: "error", error: "Customer tidak ditemukan" }, { status: 404 });
        }

        await UserService.addWalletBalance(custId, amount, description);

        return NextResponse.json({
            message: "success",
            data: {
                amount,
                description
            }
        });
    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/user/wallet/topup" });
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
