import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { provinsi, kota, kecamatan } from "@/lib/db/schema";
import { eq, or, like } from "drizzle-orm";
import logger from "@/lib/logger";

/**
 * Handler untuk pencarian lokasi (Provinsi, Kota, Kecamatan).
 * Menerima parameter query 'q' dengan minimal 2 karakter.
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
        // Melakukan pencarian lokasi dengan join antara kecamatan, kota, dan provinsi
        const results = await db
            .select({
                province: provinsi.province,
                city: kota.cityName,
                subdistrict: kecamatan.subdistrictName,
            })
            .from(kecamatan)
            .innerJoin(kota, eq(kecamatan.cityId, kota.cityId))
            .innerJoin(provinsi, eq(kota.provinceId, provinsi.provinceId))
            .where(
                or(
                    like(kecamatan.subdistrictName, `%${query}%`),
                    like(kota.cityName, `%${query}%`)
                )
            )
            .limit(20);

        // Memformat hasil pencarian menjadi string gabungan
        const locations = results.map(r => `${r.province}, ${r.city}, ${r.subdistrict}`);

        logger.info("API Response: 200 /api/locations", { results: locations.length });
        return NextResponse.json({ locations });
    } catch (error: any) {
        // Menangani error jika terjadi kegagalan saat pencarian
        logger.error("API Error: 500 /api/locations", { error: error.message, query });
        return NextResponse.json(
            { error: "Gagal memproses pencarian lokasi" },
            { status: 500 }
        );
    }
}


