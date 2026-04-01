import { NextRequest, NextResponse } from "next/server";
import { ConfigService } from "@/lib/services/config-service";
import logger from "@/lib/logger";
import { revalidateTag } from "next/cache";

const WHITELISTED_KEYS = ["packing_fee", "biaya_packing", "whatsapp_admin", "whatsapp_nomor", "batas_pembayaran", "origin_city", "kecamatan", "origin_name"];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const keys = searchParams.get("keys")?.split(",") || WHITELISTED_KEYS;

        const result: Record<string, string> = {};

        for (const key of keys) {
            if (WHITELISTED_KEYS.includes(key)) {
                if (key === "kecamatan") {
                    result[key] = await ConfigService.getCompanyKecamatan();
                } else if (key === "origin_name") {
                    result[key] = await ConfigService.getOriginName();
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

export async function POST(request: NextRequest) {
    try {
        // Trigger revalidation for the "metadata" tag
        (revalidateTag as any)("metadata");
        
        logger.info("Metadata cache invalidated via API");
        return NextResponse.json({ 
            success: true, 
            message: "Metadata cache invalidated successfully" 
        });
    } catch (error) {
        logger.error("API POST /api/config error:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Failed to invalidate cache" 
        }, { status: 500 });
    }
}
