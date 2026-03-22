import { NextRequest, NextResponse } from "next/server";
import { ConfigService } from "@/lib/services/config-service";
import logger from "@/lib/logger";

const WHITELISTED_KEYS = ["packing_fee", "biaya_packing", "whatsapp_admin", "whatsapp_nomor", "batas_pembayaran", "origin_city", "kecamatan"];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const keys = searchParams.get("keys")?.split(",") || WHITELISTED_KEYS;

        const result: Record<string, string> = {};

        for (const key of keys) {
            if (WHITELISTED_KEYS.includes(key)) {
                if (key === "kecamatan") {
                    result[key] = await ConfigService.getCompanyKecamatan();
                } else {
                    result[key] = await ConfigService.get(key);
                }
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        logger.error("API GET /api/config error:", error);
        return NextResponse.json({ message: "error" }, { status: 500 });
    }
}
