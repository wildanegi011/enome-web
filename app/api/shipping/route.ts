import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { centralConfig, companyProfile, cargo } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";

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
        const [config]: any = await db.select()
            .from(centralConfig)
            .where(eq(centralConfig.variable, CONFIG.RAJAONGKIR_KEY_VAR))
            .limit(1);

        if (!config?.value) {
            logger.error(`Shipping Calc: ${CONFIG.RAJAONGKIR_KEY_VAR} not found in DB`);
            return NextResponse.json({ message: "rajaongkir_key_not_found" }, { status: 500 });
        }

        // 2. Ambil Kota Asal (Origin) dari Profil Perusahaan
        const [company]: any = await db.select()
            .from(companyProfile)
            .where(eq(companyProfile.isAktif, 1))
            .limit(1);

        const origin = company?.kota || CONFIG.DEFAULT_ORIGIN_CITY;

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
        logger.debug("Shipping Calc: Calling Komerce API", { origin, destination, weight, courierCodes });
        const response = await fetch("https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost", {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "key": config.value
            },
            body: new URLSearchParams({
                origin: origin,
                destination: destination.toString(),
                weight: weight.toString(),
                courier: courierCodes,
                price: "lowest"
            })
        });

        const automatedCodes = ['jne', 'pos', 'wahana', 'tiki', 'jnt', 'sicepat', 'ninja', 'lion', 'anteraja', 'idexpress'];

        if (response.ok) {
            const data = await response.json();
            logger.info("Shipping Calc: Success", { data });

            // Standard RajaOngkir results
            const rajaOngkirResults = data?.data?.reduce((acc: any[], item: any) => {
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

            // Add manual cargo - Only those NOT in RajaOngkir results AND not in the automatedCodes list
            const returnedCodes = new Set(rajaOngkirResults.map((r: any) => r.code.toLowerCase()));

            const manualResults = activeCouriers
                .filter(c => {
                    const code = c.code?.toLowerCase();
                    return code && !returnedCodes.has(code) && !automatedCodes.includes(code);
                })
                .map(c => ({
                    code: (c.code || "CARGO").toUpperCase(),
                    name: c.name || c.code || "Cargo",
                    costs: [{
                        service: (c.name || c.code || "Cargo").toUpperCase(),
                        description: `Pengiriman via ${c.name || c.code}`,
                        type: 'manual',
                        cost: [{
                            value: 0,
                            etd: "",
                            note: "Biaya akan dihitung manual atau gratis"
                        }]
                    }]
                }));

            return NextResponse.json({
                rajaongkir: {
                    results: [...rajaOngkirResults, ...manualResults]
                }
            });
        } else {
            logger.error("Shipping Calc: Komerce API Failure", { status: response.status });

            // Even if API fails, return only non-automated manual cargo options
            const manualResults = activeCouriers
                .filter(c => c.code && !automatedCodes.includes(c.code.toLowerCase()))
                .map(c => ({
                    code: (c.code || "CARGO").toUpperCase(),
                    name: c.name || c.code || "Cargo",
                    costs: [{
                        service: (c.name || c.code || "Cargo").toUpperCase(),
                        description: `Pengiriman via ${c.name || c.code}`,
                        type: 'manual',
                        cost: [{
                            value: 0,
                            etd: "",
                            note: "Biaya akan dihitung manual"
                        }]
                    }]
                }));

            return NextResponse.json({
                rajaongkir: {
                    results: manualResults
                }
            });
        }

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}
