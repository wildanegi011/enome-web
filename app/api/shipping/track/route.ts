import { NextRequest, NextResponse } from "next/server";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { ConfigService } from "@/lib/services/config-service";
import { withAuth } from "@/lib/auth-utils";

/**
 * Melacak resi pengiriman menggunakan API Komerce (RajaOngkir).
 * 
 * @auth required
 * @method POST
 * @body { awb: string, courier: string, phone: string }
 */
export const POST = withAuth(async (request: NextRequest) => {
    logger.info("API Request: POST /api/shipping/track");
    try {
        const body = await request.json();
        const { awb, courier, phone } = body;

        if (!awb || !courier) {
            return NextResponse.json({ message: "missing_params" }, { status: 400 });
        }

        // 1. Ambil API Key RajaOngkir
        const apiKey = await ConfigService.get(CONFIG.RAJAONGKIR_KEY_VAR);

        if (!apiKey) {
            logger.error(`Shipping Track: ${CONFIG.RAJAONGKIR_KEY_VAR} not found in DB`);
            return NextResponse.json({ message: "rajaongkir_key_not_found" }, { status: 500 });
        }

        // 2. Persiapkan parameter untuk Komerce
        // Komerce membutuhkan kurir dalam format lowercase (jne, sicepat, jnt, dll)
        const courierCode = courier.toLowerCase();

        // Beberapa kurir membutuhkan 5 digit terakhir nomor HP penerima
        const lastPhone = phone ? phone.slice(-5) : "";

        logger.debug("Shipping Track: Calling Komerce API", { awb, courierCode, lastPhone });

        const response = await fetch("https://rajaongkir.komerce.id/api/v1/track/waybill", {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "key": apiKey
            },
            body: new URLSearchParams({
                awb: awb,
                courier: courierCode,
                last_phone_number: lastPhone
            }),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            const errorData = await response.json();
            logger.error("Shipping Track: Komerce API returned error", { status: response.status, errorData });
            return NextResponse.json({
                message: "tracking_failed",
                error: errorData?.message || "Gagal melacak resi"
            }, { status: response.status });
        }

        const data = await response.json();

        // Komerce v1 response structure is usually { status: 200, message: "...", data: { ... } }

        logger.info("Shipping Track: Komerce API returned success", { status: response.status, data });
        return NextResponse.json(data);

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
