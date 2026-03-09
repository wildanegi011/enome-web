import { db } from "@/lib/db";
import { orders, payment as paymentTable, orderdetail, produkDetail } from "@/lib/db/schema";
import { eq, and, lt, sql, inArray } from "drizzle-orm";
import logger from "@/lib/logger";
import { nowJakartaFull, getJakartaDate } from "@/lib/date-utils";

export class CronService {
    /**
     * Finds unpaid orders that have passed their expiration time,
     * cancels them, and reverts the stock.
     */
    static async cancelExpiredOrders() {
        const dhms = nowJakartaFull();
        // The DB stores Jakarta time but the driver parses it as UTC.
        // We convert our local "now" string to a UTC Date for the comparison to work.
        const now = new Date(dhms.replace(" ", "T") + ".000Z");

        logger.info(`CronService: Starting cancelExpiredOrders process at ${dhms}`);

        try {
            // 1. Find unpaid payments that have expired
            const expiredPayments = await db.select({
                id: paymentTable.id,
                paymentTransactionId: paymentTable.paymentTransactionId,
            })
                .from(paymentTable)
                .where(
                    and(
                        eq(paymentTable.isPaid, 0),
                        eq(paymentTable.isDeleted, 0),
                        lt(paymentTable.expiredTime, now)
                    )
                );

            if (expiredPayments.length === 0) {
                logger.info("CronService: No expired payments found");
                return { success: true, cancelledCount: 0 };
            }

            logger.info(`CronService: Found ${expiredPayments.length} potentially expired payments`);

            let cancelledCount = 0;

            for (const pymnt of expiredPayments) {
                // Extract orderId from format "orderId;"
                const orderId = pymnt.paymentTransactionId?.split(';')[0];
                if (!orderId) {
                    logger.warn(`CronService: Could not extract orderId from payment ID ${pymnt.id}`, { transactionId: pymnt.paymentTransactionId });
                    continue;
                }

                await db.transaction(async (tx) => {
                    // Check if the order is still "OPEN"
                    const [order] = await tx.select({
                        orderId: orders.orderId,
                        statusOrder: orders.statusOrder
                    })
                        .from(orders)
                        .where(and(eq(orders.orderId, orderId), eq(orders.statusOrder, "OPEN")))
                        .limit(1);

                    if (!order) {
                        // Mark payment as deleted/processed even if order isn't OPEN (maybe already cancelled manually)
                        await tx.update(paymentTable)
                            .set({ isDeleted: 1 } as any)
                            .where(eq(paymentTable.id, pymnt.id));
                        return;
                    }

                    logger.info(`CronService: Cancelling order ${orderId}`);

                    // A. Update Order Status to BATAL
                    await tx.update(orders)
                        .set({
                            statusOrder: "BATAL",
                            statusTagihan: "BATAL",
                            updatedAt: sql`${dhms}`,
                            updatedBy: 0 // System/Cron
                        } as any)
                        .where(eq(orders.orderId, orderId));

                    // B. Fetch Items to Revert Stock
                    const items = await tx.select()
                        .from(orderdetail)
                        .where(eq(orderdetail.orderId, orderId));

                    for (const item of items) {
                        // Revert stock in produkDetail
                        // We need to match based on produkId, warna, size, and variant
                        // Since orderdetail stores these, we can update directly if we have detailId reference,
                        // but orderdetail doesn't store detailId. We must match by attributes.

                        await tx.update(produkDetail)
                            .set({ stokNormal: sql`${produkDetail.stokNormal} + ${item.qty}` })
                            .where(and(
                                eq(produkDetail.produkId, item.produkId!),
                                eq(produkDetail.warnaId, item.warna!),
                                eq(produkDetail.size, item.ukuran!),
                                eq(produkDetail.variant, item.variant || "")
                            ));

                        logger.debug(`CronService: Reverted stock for ${item.produkId} (Qty: ${item.qty})`);
                    }

                    // C. Mark payment as processed/deleted (so it's not picked up again)
                    await tx.update(paymentTable)
                        .set({ isDeleted: 1 } as any)
                        .where(eq(paymentTable.id, pymnt.id));

                    cancelledCount++;
                });
            }

            logger.info(`CronService: Successfully cancelled ${cancelledCount} orders`);
            return { success: true, cancelledCount };

        } catch (error) {
            logger.error("CronService: Error in cancelExpiredOrders", error);
            return { success: false, error };
        }
    }
}
