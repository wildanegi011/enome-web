import { db } from "@/lib/db";
import { centralConfig, companyProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

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
            const [row]: any = await db.select({ kecamatan: companyProfile.kecamatan })
                .from(companyProfile)
                .where(eq(companyProfile.isAktif, 1))
                .limit(1);
            return row?.kecamatan ?? "";
        } catch (error) {
            logger.error("ConfigService Error: Failed to fetch company kecamatan", error);
            return "";
        }
    }
}
