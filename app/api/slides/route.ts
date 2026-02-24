import { db } from "@/lib/db";
import { slide } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";

/**
 * Handler untuk mengambil daftar gambar slide (carousel) untuk homepage.
 * Mengambil slide kategori 'main_image' yang aktif (publish=1) dan bukan untuk mobile.
 */
export async function GET() {
    logger.debug("API Request: GET /api/slides");
    try {
        const data = await db
            .select()
            .from(slide)
            .where(
                and(
                    eq(slide.publish, 1),
                    eq(slide.kategori, "main_image"),
                    eq(slide.isDeleted, 0),
                    eq(slide.isMobile, 0)
                )
            );

        return NextResponse.json(data);
    } catch (error: any) {
        logger.error("API Error: /api/slides", { error: error.message });
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

