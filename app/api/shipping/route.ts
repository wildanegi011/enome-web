import { NextRequest, NextResponse } from "next/server";
import { apiLogger } from "@/lib/logger";
import { ShippingService } from "@/lib/services/shipping-service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { origin, destination, weight, price } = body;

        if (!destination || !weight) {
            return NextResponse.json({ message: "missing_params" }, { status: 400 });
        }

        const { results, originName, originId } = await ShippingService.calculateShipping(destination, weight, origin, price);

        return NextResponse.json({
            rajaongkir: {
                results: results,
                originName: originName,
                origin: originId
            }
        });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({
            message: "error",
            error: error.message === "rajaongkir_key_not_found" ? "Konfigurasi RajaOngkir bermasalah" : "Terjadi kesalahan sistem"
        }, { status: 500 });
    }
}
