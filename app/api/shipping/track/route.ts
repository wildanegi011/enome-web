import { NextRequest, NextResponse } from "next/server";
import logger, { apiLogger } from "@/lib/logger";
import { withAuth } from "@/lib/auth-utils";
import { ShippingService } from "@/lib/services/shipping-service";

export const POST = withAuth(async (request: NextRequest) => {
    logger.info("API Request: POST /api/shipping/track");
    try {
        const { awb, courier, phone } = await request.json();

        if (!awb || !courier) {
            return NextResponse.json({ message: "missing_params" }, { status: 400 });
        }

        const data = await ShippingService.trackShipping(awb, courier, phone);

        logger.info("Shipping Track: Success", { awb, courier });
        return NextResponse.json(data);

    } catch (error: any) {
        if (error.message === "rajaongkir_key_not_found") {
            return NextResponse.json({ message: "rajaongkir_key_not_found" }, { status: 500 });
        }
        apiLogger.error(request, error);
        return NextResponse.json({ 
            message: "tracking_failed", 
            error: error.message || "Terjadi kesalahan sistem" 
        }, { status: 500 });
    }
});
