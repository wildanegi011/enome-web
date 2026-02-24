import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { centralConfig, companyProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";
import { CONFIG } from "@/lib/config";

/**
 * Handler untuk menghitung ongkos kirim menggunakan API RajaOngkir.
 * Alur:
 * 1. Ambil API Key RajaOngkir dari tabel konfigurasi.
 * 2. Ambil kota asal pengiriman dari profil perusahaan.
 * 3. Kirim request ke API RajaOngkir Pro.
 * 4. Berikan data ongkir ke frontend.
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

        // 3. Panggil API RajaOngkir Pro
        logger.debug("Shipping Calc: Calling RajaOngkir API", { origin, destination, weight, courier });
        const response = await fetch("https://pro.rajaongkir.com/api/cost", {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "key": config.value
            },
            body: new URLSearchParams({
                origin: origin,
                originType: "city",
                destination: destination.toString(),
                destinationType: "subdistrict",
                weight: weight.toString(),
                courier: courier.toLowerCase()
            })
        });

        const data = await response.json();

        if (response.ok) {
            logger.info("Shipping Calc: Success", { courier });
        } else {
            logger.error("Shipping Calc: RajaOngkir API Failure", { status: response.status, data });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        logger.error("API Error: /api/shipping", { error: error.message });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}

