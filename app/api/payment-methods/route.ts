import { NextRequest, NextResponse } from "next/server";
import { CheckoutService } from "@/lib/services/checkout-service";
import logger, { apiLogger } from "@/lib/logger";
import { withOptionalAuth } from "@/lib/auth-utils";

/**
 * Mengambil daftar metode pembayaran (rekening bank/E-Wallet/Manual) yang aktif.
 * Jika user login, juga mengambil metode pembayaran terakhir yang digunakan.
 *
 * @auth optional
 * @method GET
 * @response 200 — { methods: RekeningPembayaran[], lastUsed: string | null }
 */
export const GET = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.debug("API Request: GET /api/payment-methods");

    try {
        const userId = session?.user?.id;
        const result = await CheckoutService.getPaymentMethods(userId);

        return NextResponse.json(result);
    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/payment-methods" });
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
