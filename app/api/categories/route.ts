import { CategoryService } from "@/lib/services/category-service";
import { NextRequest, NextResponse } from "next/server";
import logger, { apiLogger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    logger.info("API Request: GET /api/categories");
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const brand = searchParams.get("brand")?.split(",").filter(Boolean);
        const gender = searchParams.get("gender")?.split(",").filter(Boolean);

        const limit = limitParam ? parseInt(limitParam, 10) : undefined;
        
        const data = await CategoryService.getCategories({
            limit: isNaN(limit as any) ? undefined : limit,
            brand,
            gender
        });

        logger.info("API Response: 200 /api/categories", { count: data.length });
        return NextResponse.json(data);
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json(
            { error: "Gagal mengambil data kategori" },
            { status: 500 }
        );
    }
}
