import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyProfile, cargo } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { ConfigService } from "@/lib/services/config-service";

/**
 * Simple in-memory cache for shipping results to avoid excessive RajaOngkir API hits.
 */
const shippingCache = new Map<string, { data: any[], expires: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
    logger.info("API Request: POST /api/shipping");
    try {
        const body = await request.json();
        const { destination, weight, courier } = body;

        logger.info("Shipping Calc: Request received", { destination, weight, courier });

        if (!destination || !weight || !courier) {
            logger.warn("Shipping Calc: Missing parameters");
            return NextResponse.json({ message: "missing_params" }, { status: 400 });
        }

        // 1. Ambil API Key RajaOngkir
        const apiKey = await ConfigService.get(CONFIG.RAJAONGKIR_KEY_VAR);

        if (!apiKey) {
            logger.error(`Shipping Calc: ${CONFIG.RAJAONGKIR_KEY_VAR} not found in DB`);
            return NextResponse.json({ message: "rajaongkir_key_not_found" }, { status: 500 });
        }

        // 2. Ambil Kota Asal (Origin) dari Config atau Profil Perusahaan
        const [company]: any = await db.select()
            .from(companyProfile)
            .where(eq(companyProfile.isAktif, 1))
            .limit(1);

        const origin = company?.kecamatan || CONFIG.DEFAULT_ORIGIN_CITY;

        // 3. Ambil daftar kurir aktif dari DB
        const activeCouriers = await db.select()
            .from(cargo)
            .where(eq(cargo.isAktif, 1));

        const automatedCodes = activeCouriers
            .filter(c => (c as any).isManual === 0)
            .map(c => c.code?.toLowerCase())
            .filter(Boolean) as string[];

        const excludedCodes = ["jtr", "cod", "instantkurir", "pickup", "cashless", "gratis"];
        const courierCodes = activeCouriers
            .map(c => c.code?.toLowerCase())
            .filter(code => code && !excludedCodes.includes(code))
            .join(':') || 'jne:sicepat:jnt';

        // Override manual untuk kurir internal/khusus yang biayanya 0 atau fixed
        if (["jtr", "cod", "instantkurir", "pickup", "cashless", "gratis"].includes(courier.toLowerCase())) {
            logger.debug("Shipping Calc: Manual override applied", { courier });
            return NextResponse.json({
                rajaongkir: {
                    results: [{
                        costs: [{
                            service: courier.toUpperCase(),
                            cost: [{ value: 0, etd: "", note: "" }]
                        }]
                    }]
                }
            });
        }

        // 4. Panggil API Komerce untuk SEMUA kurir aktif
        const cacheKey = `${origin}-${destination}-${weight}-${courierCodes}`;
        const now = Date.now();
        const cached = shippingCache.get(cacheKey);

        let rajaOngkirResults: any[] = [];

        if (cached && cached.expires > now) {
            logger.info("Shipping Calc: Using server-side cache", { cacheKey });
            rajaOngkirResults = cached.data;
        } else {
            logger.info("Shipping Calc: Calling Komerce API", {
                origin,
                destination,
                weight,
                courierCodes,
                originSource: company ? "Database (companyprofile.kecamatan)" : "Default Config"
            });

            try {
                const response = await fetch("https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost", {
                    method: "POST",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                        "key": apiKey
                    },
                    body: new URLSearchParams({
                        origin: origin,
                        destination: destination.toString(),
                        weight: weight.toString(),
                        courier: courierCodes,
                        price: "lowest"
                    }),
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });

                if (response.ok) {
                    const data = await response.json();
                    logger.info("Shipping Calc: Success", { data });

                    rajaOngkirResults = data?.data?.reduce((acc: any[], item: any) => {
                        const code = item.code.toUpperCase();
                        let existing = acc.find(r => r.code === code);
                        if (!existing) {
                            existing = { code, name: item.name, costs: [] };
                            acc.push(existing);
                        }
                        existing.costs.push({
                            service: item.service,
                            description: item.description || item.service,
                            type: 'automated',
                            cost: [{
                                value: item.cost,
                                etd: item.etd,
                                note: item.description || ""
                            }]
                        });
                        return acc;
                    }, []) || [];

                    // Store in cache
                    shippingCache.set(cacheKey, {
                        data: rajaOngkirResults,
                        expires: now + CACHE_TTL
                    });
                } else {
                    logger.error("Shipping Calc: Komerce API returned error status", { status: response.status });
                }
            } catch (fetchError: any) {
                logger.error("Shipping Calc: Komerce API fetch FAILED (Timeout or Network Error)", { message: fetchError.message });
            }
        }

        return NextResponse.json({
            rajaongkir: {
                results: rajaOngkirResults
            }
        });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
