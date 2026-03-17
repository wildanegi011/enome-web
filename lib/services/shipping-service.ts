import { db } from "@/lib/db";
import { companyProfile, cargo, kecamatan } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import logger from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { ConfigService } from "@/lib/services/config-service";

export interface ShippingOption {
    service: string;
    description: string;
    type: 'automated' | 'manual';
    courierCode: string;
    courierName: string;
    cost: {
        value: number;
        etd: string;
        note: string;
    }[];
}

export class ShippingService {
    private static cache = new Map<string, { data: any[], expires: number }>();
    private static readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes for general browsing
    private static readonly VALIDATION_TTL = 5 * 60 * 1000; // 5 minutes for final validation

    /**
     * Calculate shipping costs for all active couriers.
     */
    static async calculateShipping(destination: string | number, weight: number): Promise<{ results: any[], originName: string }> {
        const apiKey = await ConfigService.get(CONFIG.RAJAONGKIR_KEY_VAR);
        if (!apiKey) throw new Error("rajaongkir_key_not_found");

        const companyData: any = await db.select({
            kecamatan: companyProfile.kecamatan,
            subdistrictName: kecamatan.subdistrictName
        })
            .from(companyProfile)
            .leftJoin(kecamatan, eq(companyProfile.kecamatan, kecamatan.subdistrictId))
            .where(eq(companyProfile.isAktif, 1))
            .limit(1);

        const company = companyData[0];
        const origin = company?.kecamatan || CONFIG.DEFAULT_ORIGIN_CITY;
        const originName = company?.subdistrictName || company?.kecamatan || "Origin";

        // Fetch couriers that are active (1) and automated/non-manual (0)
        const activeCouriers = await db.select()
            .from(cargo)
            .where(and(eq(cargo.isAktif, 1), eq(cargo.isManual, 0)));

        const courierCodes = activeCouriers
            .map(c => c.code?.toLowerCase())
            .filter(code => !!code)
            .join(':');

        if (!courierCodes) {
            logger.warn("ShippingService: No active automated couriers found");
            return { results: [], originName };
        }

        logger.info("ShippingService: Fetching shipping costs for all couriers", { origin, destination, weight, courierCodes });

        // Bypass cache to always fetch fresh data
        const results = await this.fetchKomerce(apiKey, origin, destination, weight, courierCodes);

        return { results, originName };
    }

    /**
     * Validate a specific shipping selection (Single Courier Validation).
     */
    static async validateShipping(params: {
        destination: string | number;
        weight: number;
        courier: string;
        service: string;
        claimedPrice: number;
    }) {
        const { destination, weight, courier, service, claimedPrice } = params;

        // Check if the courier is manual (isManual: 1)
        const courierData = await db.select()
            .from(cargo)
            .where(eq(cargo.code, courier))
            .limit(1);

        const isManual = courierData.length > 0 && courierData[0].isManual === 1;

        // Skip RajaOngkir validation for manual couriers
        if (isManual) {
            return { valid: true, actualPrice: claimedPrice };
        }

        const apiKey = await ConfigService.get(CONFIG.RAJAONGKIR_KEY_VAR);
        if (!apiKey) throw new Error("rajaongkir_key_not_found");

        const [company]: any = await db.select()
            .from(companyProfile)
            .where(eq(companyProfile.isAktif, 1))
            .limit(1);

        const origin = company?.kecamatan || CONFIG.DEFAULT_ORIGIN_CITY;
        const cacheKey = `val-${origin}-${destination}-${weight}-${courier}`;

        // Bypass cache to always fetch fresh data for validation
        let results = await this.fetchKomerce(apiKey, origin, destination, weight, courier.toLowerCase());

        // Find the specific service
        const matchedCourier = results.find(r => r.code.toUpperCase() === courier.toUpperCase());
        const matchedService = matchedCourier?.costs.find((c: any) => c.service.toUpperCase() === service.toUpperCase());

        if (!matchedService) {
            logger.warn("Shipping Validation: Service not found", { courier, service });
            return { valid: false, actualPrice: 0, error: "Layanan pengiriman tidak tersedia untuk rute ini." };
        }

        const actualPrice = matchedService.cost[0].value;
        const valid = Math.abs(actualPrice - claimedPrice) < 10; // Tolerance for rounding

        if (!valid) {
            logger.warn("Shipping Validation: Price mismatch", { courier, service, claimedPrice, actualPrice });
        }

        return { valid, actualPrice };
    }

    private static async fetchKomerce(apiKey: string, origin: string, destination: string | number, weight: number, courier: string): Promise<any[]> {
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
                    weight: Math.max(1, weight).toString(),
                    courier: courier,
                    price: "lowest"
                }),
                cache: "no-store",
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.log("RajaOngkir Error:", response.status, errText);
                return [];
            }

            const data = await response.json();

            return data?.data?.reduce((acc: any[], item: any) => {
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
        } catch (error) {
            logger.error("ShippingService Fetch Error:", error);
            return [];
        }
    }
}
