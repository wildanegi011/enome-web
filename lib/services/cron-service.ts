import { db } from "@/lib/db";
import { orders, payment as paymentTable, orderdetail, produkDetail, preOrder, flashSale, produk, keranjang } from "@/lib/db/schema";
import { eq, and, lt, sql, inArray, lte, or, gte, desc } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import logger from "@/lib/logger";
import { nowJakartaFull, getJakartaDate } from "@/lib/date-utils";
import { UserService } from "@/lib/services/user-service";
import { ConfigService } from "./config-service";

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
                ammountTotalWallet: paymentTable.ammountTotalWallet,
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
                // Extract orderIds from format "orderId;orderId2;..."
                const orderIds = pymnt.paymentTransactionId?.split(';').filter(id => id.trim() !== "") || [];
                if (orderIds.length === 0) {
                    logger.warn(`CronService: Could not extract any orderId from payment ID ${pymnt.id}`, { transactionId: pymnt.paymentTransactionId });
                    continue;
                }

                await db.transaction(async (tx) => {
                    // PHP matches: status_order in ('OPEN','BATAL','CLOSE') and status_tagihan = 'BELUM BAYAR'
                    const relatedOrders = await tx.select({
                        orderId: orders.orderId,
                        statusOrder: orders.statusOrder,
                        statusTagihan: orders.statusTagihan,
                        orderTipe: orders.orderTipe,
                        customer: orders.customer
                    })
                        .from(orders)
                        .where(and(
                            inArray(orders.orderId, orderIds),
                            inArray(orders.statusOrder, ["OPEN", "BATAL", "CLOSE"]),
                            eq(orders.statusTagihan, "BELUM BAYAR")
                        ));

                    if (relatedOrders.length === 0) {
                        // Mark payment as deleted/processed even if no matching orders found (cleanup)
                        await tx.update(paymentTable)
                            .set({ isDeleted: 1 } as any)
                            .where(eq(paymentTable.id, pymnt.id));
                        return;
                    }

                    for (const order of relatedOrders) {
                        logger.info(`CronService: Processing expired order ${order.orderId} (Status: ${order.statusOrder}, Type: ${order.orderTipe})`);

                        // A. Update Order Status to CLOSE / KADALUARSA
                        await tx.update(orders)
                            .set({
                                statusOrder: "CLOSE",
                                statusTagihan: "KADALUARSA",
                                updatedAt: sql`${dhms}`,
                                updatedBy: 0 // System/Cron
                            } as any)
                            .where(eq(orders.orderId, order.orderId));

                        // B. Revert Stock ONLY if not PRE-ORDER AND status was OPEN
                        // We check status was OPEN to avoid double-reverting if already manually BATAL'd
                        if (order.orderTipe !== "PRE-ORDER" && order.statusOrder === "OPEN") {
                            const items = await tx.select()
                                .from(orderdetail)
                                .where(eq(orderdetail.orderId, order.orderId));

                            for (const item of items) {
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
                        }
                    }

                    // C. Refund wallet balance if any
                    // Note: PHP does this per payment record if grouped.
                    if (pymnt.ammountTotalWallet && pymnt.ammountTotalWallet > 0) {
                        // In merged orders, PHP uses the 'customer' of the first order in the loop.
                        // We do the same.
                        const primaryCustomer = relatedOrders[0].customer;
                        if (primaryCustomer) {
                            await UserService.addWalletBalance(
                                primaryCustomer,
                                pymnt.ammountTotalWallet,
                                `Pengembalian saldo dari transaksi ${orderIds.join(', ')}`
                            );
                            logger.info(`CronService: Refunded ${pymnt.ammountTotalWallet} to customer ${primaryCustomer} for payment ${pymnt.id}`);
                        }
                    }

                    // D. Mark payment as processed/deleted
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

    /**
     * Closes Pre-Order and Flash Sale events that have expired.
     */
    static async closeExpiredEvents() {
        const dhms = nowJakartaFull();
        const now = new Date(dhms.replace(" ", "T") + ".000Z");

        logger.info(`CronService: Starting closeExpiredEvents process at ${dhms}`);

        try {
            // 1. Close Pre-Orders
            const closedPreOrder = await db.update(preOrder)
                .set({ isAktif: 0 })
                .where(and(lte(preOrder.waktuSelesai, now), eq(preOrder.isAktif, 1)));

            // 2. Close Flash Sales
            const closedFlashSale = await db.update(flashSale)
                .set({ isAktif: 0 })
                .where(and(lte(flashSale.waktuSelesai, now), eq(flashSale.isAktif, 1)));

            logger.info(`CronService: Closed expired events.`);
            return { success: true };
        } catch (error) {
            logger.error("CronService: Error in closeExpiredEvents", error);
            return { success: false, error };
        }
    }

    /**
     * Syncs product stock by summing up stock from detail table.
     */
    static async syncProductStock() {
        logger.info(`CronService: Starting syncProductStock process`);

        try {
            // This is complex to do in Drizzle with a single query across all products
            // We use a raw SQL approach for performance, similar to the PHP one.
            const query = sql`
                UPDATE produk p
                LEFT JOIN (
                    select produk_id, sum(stok_normal) as total, sum(stok_rijek) as total_rijek
                    from produkdetail
                    group by produk_id
                ) AS x ON p.produk_id = x.produk_id
                SET 
                    p.qtystok_normal = COALESCE(x.total, 0),
                    p.qtystok_rijek = COALESCE(x.total_rijek, 0)
            `;

            await db.execute(query);

            logger.info(`CronService: Product stock synced.`);
            return { success: true };
        } catch (error) {
            logger.error("CronService: Error in syncProductStock", error);
            return { success: false, error };
        }
    }

    /**
     * Deletes or masks flash sale items in cart that have expired.
     */
    static async cleanupExpiredFlashSaleCart() {
        const dhms = nowJakartaFull();
        const now = new Date(dhms.replace(" ", "T") + ".000Z");

        logger.info(`CronService: Starting cleanupExpiredFlashSaleCart process at ${dhms}`);

        try {
            // 1. Mark items as deleted if cart expiration passed
            await db.update(keranjang)
                .set({ isDeleted: 1 })
                .where(and(
                    eq(keranjang.isFlashsale, 1),
                    lte(keranjang.flashsaleExpired, now),
                    eq(keranjang.isDeleted, 0)
                ));

            // 2. Also mark items as deleted if the Flash Sale event itself is inactive or expired
            // We find all inactive/expired flash sales first
            const inactiveFlashSales = await db.select({ id: flashSale.id })
                .from(flashSale)
                .where(or(
                    eq(flashSale.isAktif, 0),
                    lte(flashSale.waktuSelesai, now)
                ));

            if (inactiveFlashSales.length > 0) {
                const fsIds = inactiveFlashSales.map(fs => String(fs.id));
                await db.update(keranjang)
                    .set({ isDeleted: 1 })
                    .where(and(
                        eq(keranjang.isFlashsale, 1),
                        inArray(keranjang.flashsaleId, fsIds),
                        eq(keranjang.isDeleted, 0)
                    ));
            }

            logger.info(`CronService: Expired flash sale cart entries cleaned up.`);
            return { success: true };
        } catch (error) {
            logger.error("CronService: Error in cleanupExpiredFlashSaleCart", error);
            return { success: false, error };
        }
    }

    /**
     * Sets products and flash sales online based on scheduled time.
     */
    static async setOnline() {
        const dhms = nowJakartaFull();
        const now = new Date(dhms.replace(" ", "T") + ".000Z");

        logger.info(`CronService: Starting setOnline process at ${dhms}`);

        try {
            // 1. Set Flash Sales Online
            const onlineFlashSale = await db.update(flashSale)
                .set({ isAktif: 1 })
                .where(and(
                    lte(flashSale.waktuMulai, now),
                    gte(flashSale.waktuSelesai, now),
                    eq(flashSale.isAktif, 0)
                ));

            // 2. Set Products Online
            const onlineProduk = await db.update(produk)
                .set({ isOnline: 1, tglOnline: null })
                .where(and(
                    lte(produk.tglOnline, now),
                    eq(produk.isOnline, 0),
                    eq(produk.produkPreorder, 0)
                ));

            logger.info(`CronService: setOnline process completed.`);
            return { success: true };
        } catch (error) {
            logger.error("CronService: Error in setOnline", error);
            return { success: false, error };
        }
    }

    /**
     * Closes products associated with inactive Pre-Order events,
     * unless they are also associated with an active Pre-Order.
     */
    static async setCloseDetailPo() {
        logger.info(`CronService: Starting setCloseDetailPo process`);

        try {
            // Find products in inactive Pre-Orders that are currently online
            const queryInactive = sql`
                SELECT p.produk_id
                FROM pre_order po
                INNER JOIN pre_order_detail pod ON po.pre_order_id = pod.pre_order_id
                INNER JOIN produk p ON p.produk_id = pod.produk_id
                WHERE po.is_aktif = 0
                AND p.is_online = 1
                AND p.produk_preorder = 1
                GROUP BY pod.produk_id
            `;
            const [inactiveProducts] = await db.execute(queryInactive);

            // For each product, check if it exists in ANY active Pre-Order
            const productsToClose: string[] = [];
            for (const row of (inactiveProducts as unknown as any[])) {
                const productId = row.produk_id;
                const queryActive = sql`
                    SELECT p.produk_id
                    FROM pre_order po
                    INNER JOIN pre_order_detail pod ON po.pre_order_id = pod.pre_order_id
                    INNER JOIN produk p ON p.produk_id = pod.produk_id
                    WHERE po.is_aktif = 1
                    AND p.is_online = 1
                    AND p.produk_preorder = 1
                    AND p.produk_id = ${productId}
                    GROUP BY pod.produk_id
                `;
                const [activeCheck] = await db.execute(queryActive);

                if ((activeCheck as unknown as any[]).length === 0) {
                    productsToClose.push(productId);
                }
            }

            if (productsToClose.length > 0) {
                await db.update(produk)
                    .set({ isOnline: 0 })
                    .where(inArray(produk.produkId, productsToClose));

                logger.info(`CronService: Closed ${productsToClose.length} products from inactive POs.`);
            } else {
                logger.info(`CronService: No products to close from inactive POs.`);
            }

            return { success: true, closedCount: productsToClose.length };
        } catch (error) {
            logger.error("CronService: Error in setCloseDetailPo", error);
            return { success: false, error };
        }
    }

    /**
     * Tracks shipped orders and closes them if they are delivered.
     * Ported from EventController.php actionSetclose()
     */
    static async actionSetclose() {
        logger.info(`CronService: Starting actionSetclose tracking process`);

        try {
            const couriers = CONFIG.TRACKABLE_COURIERS;
            const shippedOrders = await db.select()
                .from(orders)
                .where(and(
                    eq(orders.statusOrder, "KIRIM"),
                    inArray(orders.ekspedisi, couriers),
                    eq(orders.isDeleted, 0),
                    sql`${orders.noResi} != ''`
                ));

            let closedCount = 0;

            for (const order of shippedOrders) {
                const cargo = order.ekspedisi?.toLowerCase();
                const resi = order.noResi;
                let isDelivered = false;

                // RajaOngkir Tracking Logic (Modified to use komerce.id or generic URL from config)
                try {
                    let trackingUrl = CONFIG.TRACKING.RAJAONGKIR_TRACK_URL;

                    const apiKey = await ConfigService.get(CONFIG.RAJAONGKIR_KEY_VAR);


                    const response = await fetch(trackingUrl, {
                        method: "POST",
                        headers: {
                            "content-type": "application/x-www-form-urlencoded",
                            "key": apiKey
                        },
                        body: new URLSearchParams({
                            awb: resi ?? '',
                            courier: cargo ?? '',
                        }),
                        signal: AbortSignal.timeout(10000)
                    });


                    const data = await response.json();

                    // Handle potential different response structures if URL changes
                    const status = data?.data?.delivery_status?.status;

                    if (status === "DELIVERED" || status === "Terkirim") {
                        isDelivered = true;
                    }
                } catch (err) {
                    logger.error(`CronService: RajaOngkir Tracking Error for Resi ${resi} (${cargo})`, err);
                }

                if (isDelivered) {
                    await db.update(orders)
                        .set({
                            statusOrder: "CLOSE",
                            updatedAt: sql`${nowJakartaFull()}`
                        })
                        .where(eq(orders.orderId, order.orderId));

                    closedCount++;
                    logger.info(`CronService: Order ${order.orderId} closed (Delivered via ${cargo})`);
                }
            }

            logger.info(`CronService: actionSetclose tracking process completed. Closed ${closedCount} orders.`);
            return { success: true, closedCount };
        } catch (error) {
            logger.error("CronService: Error in actionSetclose tracking", error);
            return { success: false, error };
        }
    }
}
