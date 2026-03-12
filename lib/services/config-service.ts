import { db } from "@/lib/db";
import { centralConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

interface CacheEntry {
    value: string;
    expiresAt: number;
}

export class ConfigService {
    private static cache = new Map<string, CacheEntry>();
    private static readonly DEFAULT_TTL = 30 * 1000; // 30 seconds

    /**
     * Get a configuration value by key.
     * Uses in-memory cache to reduce database load.
     */
    static async get(key: string, defaultValue: string = "", bypassCache: boolean = false): Promise<string> {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (!bypassCache && cached && cached.expiresAt > now) {
            return cached.value;
        }

        try {
            logger.info("ConfigService: Fetching from database", { key });
            const [row]: any = await db.select()
                .from(centralConfig)
                .where(eq(centralConfig.variable, key))
                .limit(1);

            const value = row?.value ?? defaultValue;

            this.cache.set(key, {
                value,
                expiresAt: now + this.DEFAULT_TTL
            });

            return value;
        } catch (error) {
            logger.error("ConfigService Error: Failed to fetch config", { key, error });
            return cached?.value ?? defaultValue;
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
     * Invalidate the cache for a specific key, or clear all cache if no key is provided.
     */
    static invalidate(key?: string) {
        if (key) {
            this.cache.delete(key);
            logger.info("ConfigService: Invalidated cache key", { key });
        } else {
            this.cache.clear();
            logger.info("ConfigService: Cleared all cache");
        }
    }
}
