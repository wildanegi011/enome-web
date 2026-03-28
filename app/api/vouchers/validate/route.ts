import { NextResponse } from "next/server";
import { VoucherService } from "@/lib/services/voucher-service";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Validasi kode voucher.
 * Mengecek ketersediaan, masa berlaku, kuota, minimal transaksi,
 * tipe order (ORDER/PRE-ORDER), dan eligibilitas customer/kategori.
 *
 * @auth required
 * @method POST
 * @body {{ kode: string, subtotal: number, order_tipe?: number|string }}
 * @response 200 (valid)   — { success: 1, message: string, nilai_voucher, tipe_voucher, maksimal_nominal_voucher_persen }
 * @response 200 (invalid) — { success: 0, message: string }
 * @response 500 — { success: 0, message: "Terjadi kesalahan sistem saat validasi voucher" }
 */
export const POST = withAuth(async (req: Request, context: any, session: any) => {
    try {
        const body = await req.json();
        const { kode, subtotal, order_tipe } = body;
        const userId = session.user.id;

        logger.info("Voucher Request: Validation attempt", { kode, subtotal, order_tipe, userId });

        if (!kode) {
            return NextResponse.json({ success: 0, message: "Kode voucher harus diisi" });
        }

        const result = await VoucherService.validateVoucher(kode, subtotal, userId, order_tipe);

        return NextResponse.json(result);

    } catch (error: any) {
        apiLogger.error(null, error, { route: "/api/vouchers/validate" });
        return NextResponse.json({ success: 0, message: "Terjadi kesalahan sistem saat validasi voucher" }, { status: 500 });
    }
});
