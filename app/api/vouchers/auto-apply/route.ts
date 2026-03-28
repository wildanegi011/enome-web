import { NextResponse } from "next/server";
import { VoucherService } from "@/lib/services/voucher-service";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Mendapatkan voucher auto-apply terbaik.
 * 
 * @auth required
 * @method GET
 * @query { subtotal: number, order_tipe?: number|string }
 */
export const GET = withAuth(async (req: Request, context: any, session: any) => {
    try {
        const { searchParams } = new URL(req.url);
        const subtotal = parseFloat(searchParams.get("subtotal") || "0");
        const order_tipe = searchParams.get("order_tipe") || "ORDER";
        const userId = session.user.id;

        const bestVoucher = await VoucherService.findAutoApplyVoucher(subtotal, userId, order_tipe);

        return NextResponse.json({
            success: 1,
            data: bestVoucher
        });

    } catch (error: any) {
        apiLogger.error(null, error, { route: "/api/vouchers/auto-apply" });
        return NextResponse.json({ success: 0, message: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
