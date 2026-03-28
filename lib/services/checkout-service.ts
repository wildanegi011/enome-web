import { db } from "@/lib/db";
import { rekeningPembayaran, orders, customer, cargo } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import logger from "@/lib/logger";

export class CheckoutService {
    /**
     * Get available payment methods and optionally the last used one for a user.
     */
    static async getPaymentMethods(userId?: number | string) {
        // 1. Get all active payment methods
        const methods = await db.select()
            .from(rekeningPembayaran)
            .where(eq(rekeningPembayaran.isAktif, 1));

        let lastUsed = null;

        // 2. If userId is provided, find last used method
        if (userId) {
            try {
                const [customerData] = await db.select({ custId: customer.custId })
                    .from(customer)
                    .where(eq(customer.userId, Number(userId)))
                    .limit(1);

                if (customerData?.custId) {
                    const [lastOrder] = await db.select({ metodebayar: orders.metodebayar })
                        .from(orders)
                        .where(eq(orders.customer, customerData.custId))
                        .orderBy(desc(orders.timestamp))
                        .limit(1);

                    if (lastOrder?.metodebayar) {
                        const rawMethod = lastOrder.metodebayar.trim();
                        if (!["WALLET", "SPLIT"].includes(rawMethod.toUpperCase())) {
                            lastUsed = rawMethod;
                        }
                    }
                }
            } catch (error) {
                logger.error("CheckoutService: Error fetching last used payment method", { error, userId });
            }
        }

        return { methods, lastUsed };
    }

    /**
     * Get active couriers.
     */
    static async getCouriers() {
        return await db.select()
            .from(cargo)
            .where(eq(cargo.isAktif, 1));
    }
}
