import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyProfile, cargo } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { ConfigService } from "@/lib/services/config-service";

/**
 * Menghitung ongkos kirim menggunakan API Komerce (RajaOngkir).
 * Alur: ambil API Key dari DB → ambil kota asal → ambil kurir aktif → panggil API.
 *
 * @auth none
 * @method POST
 * @body {{ destination: string, weight: number, courier: string }}
 * @response 200 — { rajaongkir: { results: [{ costs: [{ service, courierCode, cost: [{ value, etd, note }] }] }] } }
 * @response 400 — { message: "missing_params" }
 * @response 500 — { message: "error", error: "Terjadi kesalahan sistem" }
 */
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
        logger.info("Shipping Calc: Calling Komerce API", {
            origin,
            destination,
            weight,
            courierCodes,
            originSource: company ? "Database (companyprofile.kecamatan)" : "Default Config"
        });

        const automatedCodes = activeCouriers
            .filter(c => (c as any).isManual === 0)
            .map(c => c.code?.toLowerCase())
            .filter(Boolean) as string[];
        let rajaOngkirResults: any[] = [];

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
            } else {
                logger.error("Shipping Calc: Komerce API returned error status", { status: response.status });
            }
        } catch (fetchError: any) {
            logger.error("Shipping Calc: Komerce API fetch FAILED (Timeout or Network Error)", { message: fetchError.message });
        }

        // 5. Add manual/pickup options - ALWAYS include these even if RajaOngkir fails
        const returnedCodes = new Set(rajaOngkirResults.map((r: any) => r.code.toLowerCase()));

        const manualResults = activeCouriers
            .filter(c => {
                const code = c.code?.toLowerCase();
                const dbIsManual = (c as any).isManual === 1;
                // Return if it's explicitly marked as manual/pickup in DB
                // OR if it's a fallback for automated codes that RajaOngkir didn't return
                return code && (dbIsManual || (!automatedCodes.includes(code) || !returnedCodes.has(code)));
            })
            .map(c => {
                const dbIsManual = (c as any).isManual === 1;
                return {
                    code: (c.code || "CARGO").toUpperCase(),
                    name: c.name || c.code || "Cargo",
                    costs: [{
                        service: (c.name || c.code || "Cargo").toUpperCase(),
                        description: dbIsManual ? `Ambil sendiri di lokasi: ${c.name}` : `Pengiriman via ${c.name || c.code}`,
                        // Use 'manual' type string exclusively for Ambil Sendiri tab in Frontend
                        type: dbIsManual ? 'manual' : 'automated',
                        cost: [{
                            value: 0,
                            etd: dbIsManual ? "0 Hari" : "",
                            note: dbIsManual ? "Silakan ambil pesanan Anda" : "Biaya akan dihitung manual atau gratis"
                        }]
                    }]
                };
            });

        return NextResponse.json({
            rajaongkir: {
                results: [...rajaOngkirResults, ...manualResults]
            }
        });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
