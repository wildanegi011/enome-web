import { db } from "@/lib/db";
import { companyProfile } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import logger from "@/lib/logger";

export class CompanyService {
    private static cachedProfile: any = null;

    /**
     * Get the active primary company profile.
     * Results are cached to prevent multiple lookups in the same request cycle.
     */
    static async getPrimary() {
        if (this.cachedProfile) return this.cachedProfile;

        try {
            logger.info("CompanyService: Fetching primary company profile from database");
            const [row]: any = await db.select()
                .from(companyProfile)
                .where(and(
                    eq(companyProfile.isAktif, 1),
                    eq(companyProfile.isUtama, 1)
                ))
                .limit(1);

            if (row) {
                this.cachedProfile = row;
                return row;
            }
            
            return null;
        } catch (error) {
            logger.error("CompanyService Error: Failed to fetch primary company profile", error);
            return null;
        }
    }

    /**
     * Clear the cached profile.
     */
    static clearCache() {
        this.cachedProfile = null;
    }
}
