import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { desa } from "@/lib/db/schema";
import { eq, like, and } from "drizzle-orm";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Fetch villages for a specific sub-district.
 *
 * @auth none
 * @method GET
 * @query {{ subdistrictId: string, q?: string }}
 * @response 200 — { villages: { villageName, zipCode }[] }
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const subdistrictId = searchParams.get("subdistrictId");
    const query = searchParams.get("q");

    if (!subdistrictId) {
        return NextResponse.json({ error: "subdistrictId is required" }, { status: 400 });
    }

    try {
        const conditions = [eq(desa.subdistrictId, subdistrictId)];
        if (query && query.length >= 2) {
            conditions.push(like(desa.villageName, `%${query}%`));
        }

        const results = await db
            .select({
                villageId: desa.id,
                villageName: desa.villageName,
                zipCode: desa.zipCode,
            })
            .from(desa)
            .where(and(...conditions))
            .limit(50);

        return NextResponse.json({ villages: results });
    } catch (error: any) {
        apiLogger.error(request, error, { subdistrictId, query });
        return NextResponse.json(
            { error: "Gagal memproses pencarian desa" },
            { status: 500 }
        );
    }
}
