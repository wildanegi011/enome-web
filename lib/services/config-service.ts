import { db } from "@/lib/db";
import { centralConfig, companyProfile, kota, cargo } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import logger from "@/lib/logger";
import { CompanyService } from "./company-service";

export class ConfigService {
    /**
     * Get a configuration value by key.
     * Fetches directly from the database on every request.
     */
    static async get(key: string, defaultValue: string = "", bypassCache: boolean = false): Promise<string> {
        try {
            logger.info("ConfigService: Fetching from database", { key });
            const [row]: any = await db.select()
                .from(centralConfig)
                .where(eq(centralConfig.variable, key))
                .limit(1);

            const value = row?.value ?? defaultValue;
            return value;
        } catch (error) {
            logger.error("ConfigService Error: Failed to fetch config", { key, error });
            return defaultValue;
        }
    }

    /**
     * Get a configuration value as an integer.
     */
    static async getInt(key: string, defaultValue: number = 0, bypassCache: boolean = false): Promise<number> {
        const val = await this.get(key, defaultValue.toString(), bypassCache);
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Get the active company's kecamatan ID.
     */
    static async getCompanyKecamatan(): Promise<string> {
        try {
            const company = await CompanyService.getPrimary();
            return company?.kecamatan ?? "";
        } catch (error) {
            logger.error("ConfigService Error: Failed to fetch company kecamatan", error);
            return "";
        }
    }

    /**
     * Get the active company's origin name (City Name).
     */
    static async getOriginName(): Promise<string> {
        try {
            const company = await CompanyService.getPrimary();
            if (!company) return "";

            // If we need the actual city name from the 'kota' table, we might need a dedicated method in CompanyService
            // but for now, we'll try to get it from the cached profile if it was joined, or perform a manual lookup.
            // Actually, the original query had a join.
            const [row]: any = await db.select({ cityName: kota.cityName })
                .from(kota)
                .where(eq(kota.cityId, company.kota))
                .limit(1);

            return row?.cityName ?? "";
        } catch (error) {
            logger.error("ConfigService Error: Failed to fetch company origin name", error);
            return "";
        }
    }

    /**
     * Get the ID of the primary company profile (isUtama = 1).
     * Falls back to 6 if not found.
     */
    static async getCompanyProfileId(): Promise<number> {
        try {
            const company = await CompanyService.getPrimary();
            return company?.id ?? 6;
        } catch (error) {
            logger.error("ConfigService Error: Failed to fetch company profile ID", error);
            return 6;
        }
    }

    /**
     * Get list of trackable courier codes from database (is_aktif = 1 and is_manual = 0).
     */
    static async getTrackableCouriers(): Promise<string[]> {
        try {
            const rows = await db.select({ code: cargo.code })
                .from(cargo)
                .where(and(eq(cargo.isAktif, 1), eq(cargo.isManual, 0)));
            return rows.map(r => r.code?.toLowerCase()).filter(Boolean) as string[];
        } catch (error) {
            logger.error("ConfigService Error: Failed to fetch trackable couriers", error);
            return ["jne", "pos", "jnt", "sicepat", "tiki", "wahana", "ninja", "lion", "anteraja", "idexpress"];
        }
    }
}
