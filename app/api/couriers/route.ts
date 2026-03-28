import { NextResponse } from "next/server";
import { CheckoutService } from "@/lib/services/checkout-service";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Mengambil daftar kurir/cargo yang aktif.
 * Digunakan untuk opsi pengiriman di halaman checkout.
 *
 * @auth none
 * @method GET
 * @response 200 — Cargo[] (array of active courier objects)
 * @response 500 — { message: "error", error: "Terjadi kesalahan sistem" }
 */
export async function GET(request: Request) {
    logger.debug("API Request: GET /api/couriers");
    try {
        const couriers = await CheckoutService.getCouriers();
        return NextResponse.json(couriers);
    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/couriers" });
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}

