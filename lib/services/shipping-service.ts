import { db } from "@/lib/db";
import { companyProfile, cargo } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
    static async calculateShipping(destination: string | number, weight: number): Promise<any[]> {
        const apiKey = await ConfigService.get(CONFIG.RAJAONGKIR_KEY_VAR);
        if (!apiKey) throw new Error("rajaongkir_key_not_found");

        const [company]: any = await db.select()
            .from(companyProfile)
            .where(eq(companyProfile.isAktif, 1))
            .limit(1);

        const origin = company?.kecamatan || CONFIG.DEFAULT_ORIGIN_CITY;

        const activeCouriers = await db.select()
            .from(cargo)
            .where(eq(cargo.isAktif, 1));

        const courierCodes = activeCouriers
            .map(c => c.code?.toLowerCase())
            .filter(code => code && !["jtr", "cod", "instantkurir", "pickup", "cashless", "gratis"].includes(code))
            .join(':') || 'jne:sicepat:jnt';

        const cacheKey = `all-${origin}-${destination}-${weight}-${courierCodes}`;
        const now = Date.now();
        const cached = this.cache.get(cacheKey);

        if (cached && cached.expires > now) {
            logger.info("ShippingService: Using cache for all couriers", { cacheKey });
            return cached.data;
        }

        const rajaOngkirResults = await this.fetchKomerce(apiKey, origin, destination, weight, courierCodes);

        this.cache.set(cacheKey, {
            data: rajaOngkirResults,
            expires: now + this.DEFAULT_TTL
        });

        return rajaOngkirResults;
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

        // Skip validation for internal/special couriers
        if (["jtr", "cod", "instantkurir", "pickup", "cashless", "gratis"].includes(courier.toLowerCase())) {
            return { valid: true, actualPrice: 0 };
        }

        const apiKey = await ConfigService.get(CONFIG.RAJAONGKIR_KEY_VAR);
        if (!apiKey) throw new Error("rajaongkir_key_not_found");

        const [company]: any = await db.select()
            .from(companyProfile)
            .where(eq(companyProfile.isAktif, 1))
            .limit(1);

        const origin = company?.kecamatan || CONFIG.DEFAULT_ORIGIN_CITY;
        const cacheKey = `val-${origin}-${destination}-${weight}-${courier}`;
        const now = Date.now();
        const cached = this.cache.get(cacheKey);

        let results: any[];
        if (cached && cached.expires > now) {
            results = cached.data;
        } else {
            results = await this.fetchKomerce(apiKey, origin, destination, weight, courier.toLowerCase());
            this.cache.set(cacheKey, {
                data: results,
                expires: now + this.VALIDATION_TTL
            });
        }

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
                    weight: weight.toString(),
                    courier: courier,
                    price: "lowest"
                }),
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
