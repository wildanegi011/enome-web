import { db } from "@/lib/db";
import { orders, payment as paymentTable, orderdetail, produkDetail, preOrder, flashSale, produk, keranjang, customer, user, stok, produkDetailCabangStok } from "@/lib/db/schema";
import { eq, and, lt, sql, inArray, lte, or, gte, desc } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import logger from "@/lib/logger";
import { nowJakartaFull, getJakartaDate, parseJakarta } from "@/lib/date-utils";
import { UserService } from "@/lib/services/user-service";
import { ConfigService } from "./config-service";
import { sendOrderStatusUpdateEmail } from "@/lib/mail";

export class CronService {
    /**
     * Finds unpaid orders that have passed their expiration time,
     * cancels them, and reverts the stock.
     */
    static async cancelExpiredOrders() {
        const dhms = nowJakartaFull();
        const companyProfileId = await ConfigService.getCompanyProfileId();

        logger.info(`CronService: Starting cancelExpiredOrders process at ${dhms}`);

        try {
            // 1. Find unpaid payments that have expired using Jakarta string comparison
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
                        lt(paymentTable.expiredTime, sql`${dhms}`)
                    )
                );

            if (expiredPayments.length === 0) {
                logger.info("CronService: No expired payments found");
                return { success: true, cancelledPaymentsCount: 0, cancelledOrdersCount: 0 };
            }

            logger.info(`CronService: Found ${expiredPayments.length} potentially expired payments`);

            let cancelledPaymentsCount = 0;
            let cancelledOrdersCount = 0;
            const notifications: { email: string, name: string, orderId: string, items: any[] }[] = [];

            for (const pymnt of expiredPayments) {
                const orderIds = pymnt.paymentTransactionId?.split(';').filter(id => id.trim() !== "") || [];
                if (orderIds.length === 0) {
                    logger.warn(`CronService: Could not extract any orderId from payment ID ${pymnt.id}`, { transactionId: pymnt.paymentTransactionId });
                    continue;
                }

                await db.transaction(async (tx) => {
                    const relatedOrders = await tx.select({
                        orderId: orders.orderId,
                        statusOrder: orders.statusOrder,
                        statusTagihan: orders.statusTagihan,
                        orderTipe: orders.orderTipe,
                        customer: orders.customer,
                        companyprofileId: orders.companyprofileId
                    })
                        .from(orders)
                        .where(and(
                            inArray(orders.orderId, orderIds),
                            inArray(orders.statusOrder, ["OPEN", "BATAL", "CLOSE"]),
                            eq(orders.statusTagihan, "BELUM BAYAR")
                        ));

                    if (relatedOrders.length === 0) {
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
                                statusOrder: "BATAL",
                                statusTagihan: "KADALUARSA",
                                updatedAt: sql`${dhms}`,
                                updatedBy: 0 // System/Cron
                            } as any)
                            .where(eq(orders.orderId, order.orderId));

                        cancelledOrdersCount++;

                        // B. Fetch Order Items for Stock Revert AND Email Notification
                        const items = await tx.select({
                            namaProduk: produk.namaProduk,
                            qty: orderdetail.qty,
                            harga: orderdetail.harga,
                            warna: orderdetail.warna,
                            ukuran: orderdetail.ukuran,
                            variant: orderdetail.variant,
                            produkId: orderdetail.produkId
                        })
                            .from(orderdetail)
                            .leftJoin(produk, eq(orderdetail.produkId, produk.produkId))
                            .where(eq(orderdetail.orderId, order.orderId));

                        // C. Revert Stock ONLY if not PRE-ORDER AND status was OPEN
                        if (order.orderTipe !== "PRE-ORDER" && order.statusOrder === "OPEN") {
                            for (const item of items) {
                                // 1. Get current branch stock for logging (with lock)
                                // Join with produkDetail to get the detailId
                                const [currentDetail]: any = await tx.select({
                                    stokNormal: produkDetailCabangStok.stokNormal,
                                    detailId: produkDetail.detailId
                                })
                                    .from(produkDetail)
                                    .innerJoin(produkDetailCabangStok, eq(produkDetail.detailId, produkDetailCabangStok.produkdetailId))
                                    .where(and(
                                        eq(produkDetail.produkId, item.produkId!),
                                        eq(produkDetail.warnaId, item.warna || ""),
                                        eq(produkDetail.size, item.ukuran || ""),
                                        eq(produkDetail.variant, item.variant || ""),
                                        eq(produkDetailCabangStok.companyprofileId, order.companyprofileId || companyProfileId)
                                    ))
                                    .for("update");

                                if (currentDetail) {
                                    // 2. Update Branch Stock
                                    await tx.update(produkDetailCabangStok)
                                        .set({ stokNormal: sql`${produkDetailCabangStok.stokNormal} + ${item.qty}` })
                                        .where(and(
                                            eq(produkDetailCabangStok.produkdetailId, currentDetail.detailId),
                                            eq(produkDetailCabangStok.companyprofileId, order.companyprofileId || companyProfileId)
                                        ));

                                    // 3. Sync Main Tables (produkDetail & produk)
                                    // Sesuai instruksi: sinkronisasi total stok dari cabang ke variant, lalu ke produk
                                    await tx.execute(sql`
                                        UPDATE produkdetail pd
                                        SET 
                                            stok_normal = (SELECT COALESCE(SUM(stok_normal), 0) FROM produkdetail_cabang_stok WHERE produkdetail_id = ${currentDetail.detailId}),
                                            stok_rijek = (SELECT COALESCE(SUM(stok_rijek), 0) FROM produkdetail_cabang_stok WHERE produkdetail_id = ${currentDetail.detailId})
                                        WHERE detail_id = ${currentDetail.detailId}
                                    `);

                                    await tx.execute(sql`
                                        UPDATE produk p
                                        SET 
                                            qtystok_normal = (SELECT COALESCE(SUM(stok_normal), 0) FROM produkdetail WHERE produk_id = ${item.produkId}),
                                            qtystok_rijek = (SELECT COALESCE(SUM(stok_rijek), 0) FROM produkdetail WHERE produk_id = ${item.produkId})
                                        WHERE produk_id = ${item.produkId}
                                    `);

                                    // 4. Log Revert
                                    await tx.insert(stok).values({
                                        produkId: item.produkId,
                                        warna: item.warna,
                                        size: item.ukuran,
                                        variant: item.variant,
                                        companyprofileId: order.companyprofileId || companyProfileId,
                                        masuk: item.qty || 0,
                                        keluar: 0,
                                        stok: (currentDetail.stokNormal || 0) + (item.qty || 0),
                                        keterangan: `CANCELLED / EXPIRED ${order.orderId}`,
                                        createdAt: sql`${dhms}`,
                                        updatedAt: sql`${dhms}`,
                                        createdBy: 0,
                                        updatedBy: 0,
                                        isDeleted: 0,
                                    });
                                }

                                logger.debug(`CronService: Reverted stock for ${item.produkId} (Qty: ${item.qty})`);
                            }
                        }

                        // D. Prepare Email Notification Data (To be sent outside transaction)
                        try {
                            const [customerData]: any = await tx.select({
                                email: sql<string>`COALESCE(${user.email}, ${customer.email})`,
                                nama: sql<string>`COALESCE(${customer.namaCustomer}, ${user.nama}, ${user.username})`
                            })
                                .from(customer)
                                .leftJoin(user, eq(customer.userId, user.id))
                                .where(eq(customer.custId, order.customer!))
                                .limit(1);

                            if (customerData?.email) {
                                notifications.push({
                                    email: customerData.email,
                                    name: customerData.nama,
                                    orderId: order.orderId,
                                    items: items
                                });
                            }
                        } catch (emailErr) {
                            logger.error(`CronService: Error preparing notification for order ${order.orderId}`, emailErr);
                        }
                    }

                    // E. Refund wallet balance if any
                    if (pymnt.ammountTotalWallet && pymnt.ammountTotalWallet > 0) {
                        const primaryCustomer = relatedOrders[0].customer;
                        if (primaryCustomer) {
                            await UserService.addWalletBalance(
                                primaryCustomer,
                                pymnt.ammountTotalWallet,
                                `Pengembalian saldo dari transaksi ${orderIds.join(', ')}`
                            );
                        }
                    }

                    // F. Mark payment as processed/deleted
                    await tx.update(paymentTable)
                        .set({ isDeleted: 1 } as any)
                        .where(eq(paymentTable.id, pymnt.id));

                    cancelledPaymentsCount++;
                });
            }

            // 3. Send Email Notifications sequentially outside transaction
            for (const note of notifications) {
                try {
                    logger.info(`CronService: Background processing email for order ${note.orderId} to ${note.email}`);
                    await sendOrderStatusUpdateEmail(note.email, {
                        orderId: note.orderId,
                        customerName: note.name,
                        status: "KADALUARSA (Expired)",
                        items: note.items
                    });
                } catch (sendErr) {
                    logger.error(`CronService: Failed to send background email for order ${note.orderId}`, sendErr);
                }
            }

            logger.info(`CronService: Successfully cancelled ${cancelledPaymentsCount} payments affecting ${cancelledOrdersCount} orders`);
            return { success: true, cancelledPaymentsCount, cancelledOrdersCount };

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

        logger.info(`CronService: Starting closeExpiredEvents process at ${dhms}`);

        try {
            // 1. Close Pre-Orders
            const [closedPreOrder]: any = await db.update(preOrder)
                .set({ isAktif: 0 })
                .where(and(lte(preOrder.waktuSelesai, sql`${dhms}`), eq(preOrder.isAktif, 1)));

            // 2. Close Flash Sales
            const [closedFlashSale]: any = await db.update(flashSale)
                .set({ isAktif: 0 })
                .where(and(lte(flashSale.waktuSelesai, sql`${dhms}`), eq(flashSale.isAktif, 1)));

            const poCount = closedPreOrder?.affectedRows || 0;
            const fsCount = closedFlashSale?.affectedRows || 0;

            logger.info(`CronService: Closed ${poCount} expired pre-orders and ${fsCount} flash sales.`);
            return { success: true, poCount, fsCount };
        } catch (error) {
            logger.error("CronService: Error in closeExpiredEvents", error);
            return { success: false, error };
        }
    }

    /**
     * Syncs product stock by summing up stock from detail table.
     */
    // static async syncProductStock() {
    //     logger.info(`CronService: Starting syncProductStock process`);

    //     try {
    //         // This is complex to do in Drizzle with a single query across all products
    //         // We use a raw SQL approach for performance, similar to the PHP one.
    //         const query = sql`
    //             UPDATE produk p
    //             LEFT JOIN (
    //                 select produk_id, sum(stok_normal) as total, sum(stok_rijek) as total_rijek
    //                 from produkdetail
    //                 group by produk_id
    //             ) AS x ON p.produk_id = x.produk_id
    //             SET 
    //                 p.qtystok_normal = COALESCE(x.total, 0),
    //                 p.qtystok_rijek = COALESCE(x.total_rijek, 0)
    //         `;

    //         await db.execute(query);

    //         logger.info(`CronService: Product stock synced.`);
    //         return { success: true };
    //     } catch (error) {
    //         logger.error("CronService: Error in syncProductStock", error);
    //         return { success: false, error };
    //     }
    // }

    static async syncProductStock() {
        logger.info(`CronService: Starting syncProductStock process`);

        try {
            // Step 1: Sync produkDetail (Variation Level) from produkDetailCabangStok (Branch Level)
            const queryDetail = sql`
                UPDATE produkdetail pd
                LEFT JOIN (
                    SELECT 
                        produkdetail_id, 
                        SUM(stok_normal) as t_normal, 
                        SUM(stok_rijek) as t_rijek
                    FROM produkdetail_cabang_stok
                    GROUP BY produkdetail_id
                ) x ON pd.detail_id = x.produkdetail_id
                SET 
                    pd.stok_normal = COALESCE(x.t_normal, 0),
                    pd.stok_rijek = COALESCE(x.t_rijek, 0)
            `;

            await db.execute(queryDetail);
            logger.info(`CronService: produkDetail synced from branch stock.`);

            // Step 2: Sync produk (Product Level) from produkDetail (Variation Level)
            const queryProduk = sql`
                UPDATE produk p
                LEFT JOIN (
                    SELECT 
                        produk_id, 
                        SUM(stok_normal) as total, 
                        SUM(stok_rijek) as total_rijek
                    FROM produkdetail
                    GROUP BY produk_id
                ) AS x ON p.produk_id = x.produk_id
                SET 
                    p.qtystok_normal = COALESCE(x.total, 0),
                    p.qtystok_rijek = COALESCE(x.total_rijek, 0)
            `;

            await db.execute(queryProduk);
            logger.info(`CronService: produk synced from produkDetail.`);

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

        logger.info(`CronService: Starting cleanupExpiredFlashSaleCart process at ${dhms}`);

        try {
            // 1. Mark items as deleted if cart expiration passed
            const [deletedByExpiry]: any = await db.update(keranjang)
                .set({ isDeleted: 1 })
                .where(and(
                    eq(keranjang.isFlashsale, 1),
                    lte(keranjang.flashsaleExpired, sql`${dhms}`),
                    eq(keranjang.isDeleted, 0)
                ));

            // 2. Also mark items as deleted if the Flash Sale event itself is inactive or expired
            // We find all inactive/expired flash sales first
            const inactiveFlashSales = await db.select({ id: flashSale.id })
                .from(flashSale)
                .where(or(
                    eq(flashSale.isAktif, 0),
                    lte(flashSale.waktuSelesai, sql`${dhms}`)
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

        logger.info(`CronService: Starting setOnline process at ${dhms}`);

        try {
            // 1. Set Flash Sales Online
            const [onlineFlashSale]: any = await db.update(flashSale)
                .set({ isAktif: 1 })
                .where(and(
                    lte(flashSale.waktuMulai, sql`${dhms}`),
                    gte(flashSale.waktuSelesai, sql`${dhms}`),
                    eq(flashSale.isAktif, 0)
                ));

            // 2. Set Products Online
            const [onlineProduk]: any = await db.update(produk)
                .set({ isOnline: 1, tglOnline: null })
                .where(and(
                    lte(produk.tglOnline, sql`${dhms}`),
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
            const couriers = await ConfigService.getTrackableCouriers();
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
