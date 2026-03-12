import { NextRequest, NextResponse } from "next/server";
import { apiLogger } from "@/lib/logger";
import { ShippingService } from "@/lib/services/shipping-service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { destination, weight } = body;

        if (!destination || !weight) {
            return NextResponse.json({ message: "missing_params" }, { status: 400 });
        }

        const rajaOngkirResults = await ShippingService.calculateShipping(destination, weight);

        return NextResponse.json({
            rajaongkir: {
                results: rajaOngkirResults
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
