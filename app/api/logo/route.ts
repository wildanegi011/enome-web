import { NextResponse } from "next/server";
import { SlideService } from "@/lib/services/slide-service";
import logger from "@/lib/logger";

export async function GET() {
    try {
        const logoUrl = await SlideService.getFrontendLogo();
        return NextResponse.json({
            success: true,
            data: logoUrl
        });
    } catch (error: any) {
        logger.error("API GET /api/logo: Error fetching frontend logo", { error: error.message });
        return NextResponse.json({
            success: false,
            error: "Failed to fetch logo"
        }, { status: 500 });
    }
}
