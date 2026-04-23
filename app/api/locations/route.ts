import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { provinsi, kota, kecamatan } from "@/lib/db/schema";
import { eq, or, like, and } from "drizzle-orm";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Pencarian lokasi (Provinsi, Kota, Kecamatan).
 * Minimal 2 karakter untuk memulai pencarian.
 *
 * @auth none
 * @method GET
 * @query {{ q: string }} (min 2 chars)
 * @response 200 — { locations: { label, province, provinceId, city, cityId, subdistrict, subdistrictId }[] }
 * @response 500 — { error: "Gagal memproses pencarian lokasi" }
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    logger.info("API Request: GET /api/locations", { query });

    // Validasi input query
    if (!query || query.length < 2) {
        logger.warn("API Skip: Query too short /api/locations", { query });
        return NextResponse.json({ locations: [] });
    }

    try {
        const queryParts = query.split(/[\s,]+/).filter(Boolean);
        const searchConditions = queryParts.map(part => {
            const pattern = `%${part}%`;
            return or(
                like(kecamatan.subdistrictName, pattern),
                like(kota.cityName, pattern),
                like(provinsi.province, pattern)
            );
        });

        // Melakukan pencarian lokasi dengan join antara kecamatan, kota, dan provinsi
        const results = await db
            .select({
                province: provinsi.province,
                provinceId: provinsi.provinceId,
                city: kota.cityName,
                cityId: kota.cityId,
                subdistrict: kecamatan.subdistrictName,
                subdistrictId: kecamatan.subdistrictId,
            })
            .from(kecamatan)
            .innerJoin(kota, eq(kecamatan.cityId, kota.cityId))
            .innerJoin(provinsi, eq(kota.provinceId, provinsi.provinceId))
            .where(and(...searchConditions))
            .limit(20);

        // Memformat hasil pencarian menjadi objek terstruktur
        const locations = results.map(r => ({
            label: `${r.province}, ${r.city}, ${r.subdistrict}`,
            province: r.province,
            provinceId: r.provinceId,
            city: r.city,
            cityId: r.cityId,
            subdistrict: r.subdistrict,
            subdistrictId: r.subdistrictId
        }));

        logger.info("API Response: 200 /api/locations", { results: locations.length });
        return NextResponse.json({ locations });
    } catch (error: any) {
        apiLogger.error(request, error, { query });
        return NextResponse.json(
            { error: "Gagal memproses pencarian lokasi" },
            { status: 500 }
        );
    }
}


