import { ASSET_URL } from "@/config/config";
import { db } from "@/lib/db";
import {
    keranjang, orders, orderdetail, produk, produkDetail,
    preOrder, wallet, voucher, voucherHistory, payment as paymentTable, flashSale, centralConfig, rekeningPembayaran, companyProfile, stok
} from "@/lib/db/schema";

import { eq, and, sql, desc, like, or } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import logger from "@/lib/logger";
import { nowJakartaYYMMDD, nowJakartaDate, nowJakartaFull, getJakartaDate, parseJakarta } from "@/lib/date-utils";
import { ConfigService } from "./config-service";
import { sendNewOrderAdminNotification, sendOrderConfirmationEmail } from "@/lib/mail";
import pusher from "@/lib/pusher";

export class OrderService {
    /**
     * Generate kode unik untuk transfer BCA.
     * Kode unik = 3 digit terakhir totalTagihan (100-999).
     * Adjustment = jumlah yang ditambahkan ke base agar 3 digit terakhir = targetCode.
     *
     * @param baseAmount - Total sebelum kode unik
     * @returns {{ targetCode: number, adjustment: number }}
     */
    static async generateUniqueCode(baseAmount: number): Promise<{ targetCode: number, adjustment: number }> {
        const configMin = await ConfigService.getInt("code_uniq_payment_min", 1);
        const configMax = await ConfigService.getInt("code_uniq_payment_max", 222);

        // Ensure min is smaller than max even if swapped in database
        const min = Math.min(configMin, configMax);
        const max = Math.max(configMin, configMax);
        const range = Math.max(1, max - min + 1);

        let adjustment: number;
        let targetCode: number;
        let isUnique = false;
        let attempts = 0;

        do {
            // 1. Generate random adjustment in the range (e.g. 1-222)
            adjustment = Math.floor(Math.random() * range) + min;

            // 2. targetCode is what is displayed to user as "Unique Code". 
            // The user wants the adjustment itself to be the unique code.
            targetCode = adjustment;

            // 3. The final total's last 3 digits will be what admin sees.
            // We check for uniqueness of this final suffix.
            const finalTotalSuffix = (Math.round(baseAmount) + adjustment) % 1000;

            // Cek apakah ada order pending dengan 3 digit terakhir sama
            const [existing] = await db.select({ orderId: orders.orderId })
                .from(orders)
                .where(
                    and(
                        eq(orders.statusOrder, "OPEN"),
                        sql`MOD(${orders.totalTagihan}, 1000) = ${finalTotalSuffix}`
                    )
                )
                .limit(1);

            if (!existing) {
                isUnique = true;
            } else {
                attempts++;
            }
        } while (!isUnique && attempts < 10);

        return { targetCode, adjustment };
    }

    static async generateOrderId() {
        logger.info("OrderService: Generating Order ID");
        const yymmdd = nowJakartaYYMMDD();
        const prefix = `PO#N${yymmdd}`;

        const [lastOrder]: any = await db.select({ orderId: orders.orderId })
            .from(orders)
            .where(like(orders.orderId, `${prefix}%`))
            .orderBy(desc(sql`LENGTH(${orders.orderId})`), desc(orders.orderId))
            .limit(1);

        let nextIndex = 1;
        if (lastOrder) {
            const lastIdSuffix = lastOrder.orderId.substring(prefix.length);
            nextIndex = parseInt(lastIdSuffix) + 1;
        }
        return `${prefix}${String(nextIndex).padStart(4, '0')}`;
    }

    static async verifyStock(cartItems: any[]) {
        logger.info("OrderService: Verifying stock", { itemCount: cartItems.length });
        let totalWeight = 0;
        let totalHpp = 0;
        const verifiedItems: any[] = [];
        const issues: any[] = [];

        for (const item of cartItems) {
            const [result]: any = await db.select({
                detail: produkDetail,
                namaProduk: produk.namaProduk,
                isOnline: produk.isOnline
            })
                .from(produkDetail)
                .leftJoin(produk, eq(produk.produkId, produkDetail.produkId))
                .where(and(
                    eq(produkDetail.produkId, item.produkId!),
                    eq(produkDetail.warnaId, item.warna!),
                    eq(produkDetail.size, item.size!),
                    eq(produkDetail.variant, item.variant || "")
                ))
                .limit(1);

            const productName = result?.namaProduk || item.namaProduk || item.produkId;
            const variantInfo = [item.warna, item.size, item.variant].filter(Boolean).join(" / ");

            if (!result || !result.detail) {
                issues.push({
                    produkId: item.produkId,
                    namaProduk: productName,
                    variant: variantInfo,
                    type: "not_found",
                    message: `Produk ${productName} (${variantInfo}) sudah tidak tersedia.`
                });
                continue;
            }

            if (result.isOnline === 0) {
                issues.push({
                    produkId: item.produkId,
                    namaProduk: productName,
                    variant: variantInfo,
                    type: "offline",
                    message: `Toko sedang tutup atau produk ${productName} tidak tersedia.`
                });
                continue;
            }

            const detail = result.detail;
            const qty = item.qty || item.qtyProduk || 0;
            const stokTersedia = detail.stokNormal || 0;

            if (stokTersedia < qty) {
                if (stokTersedia <= 0) {
                    issues.push({
                        produkId: item.produkId,
                        namaProduk: productName,
                        variant: variantInfo,
                        type: "sold_out",
                        availableStock: 0,
                        requestedQty: qty,
                        message: `Produk ${productName} (${variantInfo}) sudah habis terjual.`
                    });
                } else {
                    issues.push({
                        produkId: item.produkId,
                        namaProduk: productName,
                        variant: variantInfo,
                        type: "insufficient",
                        availableStock: stokTersedia,
                        requestedQty: qty,
                        message: `Stok ${productName} (${variantInfo}) tidak cukup (Tersedia: ${stokTersedia}).`
                    });
                }
                continue;
            }

            // Flash Sale validation
            if (item.isFlashsale === 1) {
                if (item.flashsaleId) {
                    const [fsData]: any = await db.select({
                        isAktif: flashSale.isAktif,
                        waktuSelesai: flashSale.waktuSelesai
                    }).from(flashSale).where(eq(flashSale.id, Number(item.flashsaleId))).limit(1);

                    if (!fsData || fsData.isAktif !== 1) {
                        issues.push({
                            produkId: item.produkId,
                            namaProduk: productName,
                            variant: variantInfo,
                            type: "flashsale_ended",
                            message: `Flash Sale ${productName} sudah berakhir.`
                        });
                        continue;
                    }

                    const dhms = nowJakartaFull();
                    const now = parseJakarta(dhms).getTime();
                    const expiredDate = parseJakarta(fsData.waktuSelesai || item.flashsaleExpired).getTime();

                    if (now > expiredDate) {
                        issues.push({
                            produkId: item.produkId,
                            namaProduk: productName,
                            variant: variantInfo,
                            type: "flashsale_expired",
                            message: `Waktu Flash Sale ${productName} telah berakhir.`
                        });
                        continue;
                    }
                }
            }

            totalWeight += (detail.berat || 0) * qty;
            totalHpp += (detail.hpp || 0) * qty;
            verifiedItems.push({ ...item, detail, qty });
        }

        if (issues.length > 0) {
            return {
                success: false,
                issues,
                error: issues[0].message // Backward compatibility for simple error display
            };
        }

        return { success: true, verifiedItems, totalWeight, totalHpp };
    }

    static async createOrder(orderData: any, verifiedItems: any[], walletAdjustment: number, uniqueCode: number = 0, bankData: any = null) {
        logger.info("OrderService: Creating Order", { orderId: orderData.orderId, userId: orderData.userId, uniqueCode });
        const ymd = nowJakartaDate();
        const dhms = nowJakartaFull();

        const { orderId, userId, customerData, totalAmount, shipping, payment, costs, meta } = orderData;
        const { totalWeight, totalHpp } = costs;
        let { shippingCost, packingFee, discountAmount, totalTagihan, finalWalletAmount, finalBankAmount } = meta;

        // Unique code is already added to totalTagihan and finalBankAmount before calling this method

        // Check active pre-order
        const [activePreOrder]: any = await db.select().from(preOrder).where(eq(preOrder.isAktif, 1)).limit(1);
        const orderTipe = activePreOrder ? "PRE-ORDER" : "ORDER";
        const statusOrder = finalBankAmount <= 0 ? "PROSES PACKING" : "OPEN";

        // Fetch Company Name from companyprofile table
        const [company]: any = await db.select({
            namaPerusahaan: companyProfile.namaPerusahaan
        })
            .from(companyProfile)
            .where(eq(companyProfile.id, CONFIG.DEFAULT_COMPANY_PROFILE_ID))
            .limit(1);

        const companyName = company?.namaPerusahaan || "SYLLA HIJAB";

        const result = await db.transaction(async (tx) => {
            // A. Insert Master Order
            logger.info("OrderService: Step A - Inserting Master Order", { orderId });
            try {
                const orderValues: any = {
                    orderId,
                    customer: customerData.custId || null,
                    userId: customerData.custId || null,
                    statusCustomer: customerData.kategoriCustomer || null,
                    tglOrder: sql`${ymd}`,
                    totalOrder: verifiedItems.length,
                    totalHarga: Math.round(totalAmount),
                    ongkir: Math.round(shippingCost),
                    biayalain: Math.round(packingFee),
                    totalTagihan: Math.round(totalTagihan),
                    namaPenerima: shipping.name || "",
                    teleponPenerima: shipping.phone || "",
                    alamatKirim: shipping.address || "",
                    ekspedisi: shipping.courier || "",
                    statusTagihan: finalBankAmount > 0 ? "BELUM BAYAR" : "BAYAR",
                    statusOrder,
                    proses1: "Y",
                    proses2: finalBankAmount <= 0 ? "Y" : "N",
                    proses3: "N",
                    proses4: "N",
                    noResi: "",
                    keterangan: uniqueCode > 0
                        ? `${orderData.catatan || ""} (Kode Unik: ${uniqueCode})`.trim()
                        : (orderData.catatan || ""),
                    metodebayar: finalWalletAmount > 0 && finalBankAmount > 0 ? "SPLIT" : (finalWalletAmount > 0 ? "WALLET" : payment),
                    orderTipe,
                    preorderId: activePreOrder?.preOrderId ? Number(activePreOrder.preOrderId) : null,
                    isReadyStok: activePreOrder ? 0 : 1,
                    catatanKhusus: orderData.specialNotes || null,
                    namaPengirim: orderData.isDropshipper ? (orderData.dropshipper?.name || "") : companyName,
                    teleponPengirim: orderData.isDropshipper ? (orderData.dropshipper?.phone || "") : "",
                    alamatPengirim: orderData.isDropshipper ? (orderData.dropshipper?.address || "") : "",
                    timestamp: sql`${dhms}`,
                    viaWallet: Math.round(finalWalletAmount),
                    viaBank: Math.round(finalBankAmount),
                    companyprofileId: CONFIG.DEFAULT_COMPANY_PROFILE_ID,
                    customerAlamatIdPenerima: Number(shipping.addressId) || 0,
                    shipto: (shipping.customerId && shipping.customerId !== 0 && shipping.customerId !== "0") ? shipping.customerId.toString() : (customerData.custId || ""),
                    provinsiKirim: shipping.provinceId || shipping.provinsi || "",
                    kotaKirim: shipping.cityId || shipping.kota || "",
                    distrikKirim: shipping.districtId || shipping.kecamatan || "",
                    service: orderData.service || "",
                    kodeservice: orderData.service || "",
                    shipper: orderData.isDropshipper ? "PEMESAN" : companyName,
                    totcost: totalHpp || 0,
                    totalBerat: totalWeight || 0,
                    updatedAt: sql`${dhms}`,
                    isDeleted: 0,
                    isOnline: 1,
                    updatedBy: 0,
                    // Mandatory fields missing from original schema but present in DB
                    customerAlamatIdPengirim: 0,
                    suratJalanCreatedAt: sql`${dhms}`,
                    suratJalanCreatedBy: 0,
                    catatanKhususAdmin: "",
                    jneNoTiket: "",
                    jneCodeOrigin: "",
                    jneCodeDestination: "",
                    catatanOrderGabung: "",
                    idOrderGabung: 0,
                };

                logger.debug("OrderService: Attempting Master Insert", { orderId });
                await tx.insert(orders).values(orderValues);
            } catch (insertError: any) {
                logger.error("OrderService: Step A FAILED!", {
                    message: insertError.message,
                    code: insertError.code,
                    sqlState: insertError.sqlState,
                    sqlMessage: insertError.sqlMessage,
                    stack: insertError.stack
                });
                throw insertError;
            }
            logger.info("OrderService: Step A Success");

            // B. Insert Details & Update Stock
            logger.info("OrderService: Step B - Inserting Details & Updating Stock");
            for (const item of verifiedItems) {
                // 1. KUNCI BARIS STOK: Gunakan FOR UPDATE pada produkDetail agar tidak ada 
                // transaksi lain yang bisa mengubah stok varian ini secara bersamaan.
                const [lockedDetailRows]: any = await tx.execute(sql`
                    SELECT stok_normal as stokNormal, produk_id as produkId 
                    FROM produkdetail 
                    WHERE detail_id = ${item.detail.detailId} 
                    FOR UPDATE
                `);
                const lockedDetail = lockedDetailRows[0];

                if (!lockedDetail) {
                    throw new Error(`Maaf, data stok untuk ${item.namaProduk} tidak ditemukan.`);
                }

                // 2. CEK STATUS ONLINE: Ambil status produk secara fresh
                const [productInfo]: any = await tx.select({ isOnline: produk.isOnline })
                    .from(produk)
                    .where(eq(produk.produkId, lockedDetail.produkId))
                    .limit(1);

                if (!productInfo || productInfo.isOnline === 0) {
                    throw new Error(`Mohon maaf, produk ${item.namaProduk} sedang tidak tersedia atau toko kami sedang tutup.`);
                }

                const qty = item.qty || 0;
                if ((lockedDetail.stokNormal || 0) < qty) {
                    throw new Error("Mohon maaf, stok produk di keranjang Anda baru saja berkurang atau tidak tersedia lagi.");
                }

                const harga = item.harga || item.hargaPoduk || 0;

                const detailValues: any = {
                    orderId,
                    produkId: item.produkId,
                    ukuran: item.size,
                    warna: item.warna,
                    harga: Math.round(harga),
                    qty: qty,
                    jmlHarga: Math.round(harga * qty),
                    catatan: item.keterangan || "",
                    berat: item.detail.berat || 0,
                    jmlBerat: (item.detail.berat || 0) * qty,
                    kategori: customerData.kategoriCustomer || "",
                    variant: item.variant || ""
                };

                await tx.insert(orderdetail).values(detailValues);

                await tx.update(produkDetail)
                    .set({ stokNormal: sql`${produkDetail.stokNormal} - ${qty}` })
                    .where(eq(produkDetail.detailId, item.detail.detailId));

                // 3. Log Stock Movement
                await tx.insert(stok).values({
                    produkId: item.produkId,
                    warna: item.warna,
                    size: item.size,
                    companyprofileId: CONFIG.DEFAULT_COMPANY_PROFILE_ID,
                    masuk: 0,
                    keluar: qty,
                    stok: (lockedDetail.stokNormal || 0) - qty,
                    keterangan: `CHECKOUT ${orderId}`,
                    createdAt: sql`${dhms}`,
                    updatedAt: sql`${dhms}`,
                    createdBy: Number(userId) || 1,
                    updatedBy: Number(userId) || 1,
                    isDeleted: 0,
                });
            }
            logger.info("OrderService: Step B Success");

            // C. Clear Cart
            logger.info("OrderService: Step C - Clearing Selected Cart Items", { count: verifiedItems.length });
            const orderedItemIds = verifiedItems.map(item => item.id).filter(id => id !== undefined);

            if (orderedItemIds.length > 0) {
                const { inArray } = await import("drizzle-orm");
                await tx.update(keranjang)
                    .set({ isDeleted: 1, updatedAt: sql`${dhms}` } as any)
                    .where(and(
                        eq(keranjang.custId, Number(userId)),
                        inArray(keranjang.id, orderedItemIds)
                    ));
            }
            logger.info("OrderService: Step C Success");

            // D. Wallet Deduction
            if (finalWalletAmount > 0) {
                logger.info("OrderService: Step D - Wallet Deduction", { finalWalletAmount });
                const [lastWallet]: any = await tx.select().from(wallet).where(eq(wallet.custId, customerData.custId)).orderBy(desc(wallet.id)).limit(1);
                const currentSaldo = lastWallet?.saldo || 0;
                const walletValues: any = {
                    custId: customerData.custId,
                    debit: 0,
                    kredit: Math.round(finalWalletAmount),
                    saldo: Math.round(currentSaldo - finalWalletAmount),
                    keterangan: `PEMBAYARAN ${orderId}`,
                    createdAt: sql`${dhms}`,
                    updatedAt: sql`${dhms}`
                };
                await tx.insert(wallet).values(walletValues);
                logger.info("OrderService: Step D Success");
            }

            // E. Voucher Update + History
            if (orderData.voucherCode) {
                logger.info("OrderService: Step E - Voucher Update", { voucherCode: orderData.voucherCode });

                // E1. Ambil data voucher untuk snapshot ke history
                const [voucherRow]: any = await tx.select()
                    .from(voucher)
                    .where(eq(voucher.kodeVoucher, orderData.voucherCode))
                    .limit(1);

                // E2. Kurangi kuota
                await tx.update(voucher)
                    .set({ kuotaVoucher: sql`${voucher.kuotaVoucher} - 1` })
                    .where(eq(voucher.kodeVoucher, orderData.voucherCode));

                // E3. Insert ke voucher_history
                if (voucherRow) {
                    await tx.insert(voucherHistory).values({
                        kodeVoucher: voucherRow.kodeVoucher,
                        namaVoucher: voucherRow.namaVoucher || "",
                        tanggalMulai: voucherRow.tanggalMulai,
                        tanggalKadaluarsa: voucherRow.tanggalKadaluarsa,
                        nilaiVoucher: voucherRow.nilaiVoucher || 0,
                        tipeVoucher: voucherRow.tipeVoucher || "",
                        orderTipe: voucherRow.orderTipe || "",
                        kategoriCustomerId: voucherRow.kategoriCustomerId || "",
                        minimalTransaksi: voucherRow.minimalTransaksi || 0,
                        maksimalNominalVoucherPersen: voucherRow.maksimalNominalVoucherPersen || 0,
                        custId: customerData.custId,
                        kuotaVoucher: (voucherRow.kuotaVoucher || 1) - 1,
                        deskripsiVoucher: voucherRow.deskripsiVoucher || "",
                        isAktif: voucherRow.isAktif ?? 1,
                        createdBy: Number(userId) || 1,
                        updatedAt: getJakartaDate(),
                        updatedBy: Number(userId) || 1,
                        syaratDanKetentuan: voucherRow.syaratDanKetentuan || "",
                    });
                }
                logger.info("OrderService: Step E Success");
            }

            // F. Payment Insertion
            logger.info("OrderService: Step F - Payment Insertion");

            // Ambil batas pembayaran dari ConfigService (cached)
            const rawInterval = await ConfigService.get("batas_pembayaran", "1");
            const isDays = /^\d+$/.test(rawInterval);
            const paymentInterval = isDays ? `${rawInterval} DAY` : rawInterval;

            // Calculate expiredTime value for frontend response
            let expiredTimeValue = null;
            if (finalBankAmount > 0) {
                const now = getJakartaDate();
                if (isDays) {
                    now.setDate(now.getDate() + parseInt(rawInterval));
                } else if (rawInterval.toUpperCase().includes("HOUR")) {
                    const hours = parseInt(rawInterval);
                    now.setHours(now.getHours() + hours);
                } else if (rawInterval.toUpperCase().includes("MINUTE")) {
                    const minutes = parseInt(rawInterval);
                    now.setMinutes(now.getMinutes() + minutes);
                } else {
                    now.setDate(now.getDate() + 1); // Fallback 1 day
                }
                const { formatJakarta } = await import("@/lib/date-utils");
                expiredTimeValue = formatJakarta(now, 'full').replace(' ', 'T') + '+07:00';
            }

            const paymentValues: any = {
                isPaid: finalBankAmount <= 0 ? 1 : 0,
                paidTime: finalBankAmount <= 0 ? sql`${dhms}` : null,
                expiredTime: finalBankAmount > 0 ? sql`DATE_ADD(${dhms}, INTERVAL ${sql.raw(paymentInterval)})` : null,
                subtotal: Math.round(totalAmount),
                otherFee: Math.round(packingFee),
                postFee: Math.round(shippingCost),
                ammount: Math.round(totalAmount + shippingCost + packingFee - discountAmount),
                voucherNominal: discountAmount || 0,
                uniqueCode: uniqueCode > 0 ? uniqueCode.toString() : "0",
                ammountTotal: Math.round(finalBankAmount > 0 ? finalBankAmount : totalTagihan),
                ammountTotalWallet: Math.round(finalWalletAmount),
                paymentTransactionTypeId: 2,
                paymentTransactionId: `${orderId};`,
                createdAt: sql`${dhms}`,
                createdBy: Number(userId) || 1,
                tujuanAtasNama: bankData ? bankData.namaPemilik : (payment === "Transfer Bank BCA" ? "TRY SETYO UTOMO" : "-"),
                tujuanNamaBank: bankData ? bankData.namaBank : (payment === "Transfer Bank BCA" ? "BCA" : (payment || "-")),
                tujuanLogoBank: bankData ? `${ASSET_URL}/img/rekening_pembayaran/${bankData.logoBank}` : "-",
                tujuanNoRekening: bankData ? bankData.noRekening : (payment === "Transfer Bank BCA" ? "2810377740" : "-"),
                paymentType: finalWalletAmount > 0 && finalBankAmount > 0 ? "SPLIT" : (finalWalletAmount > 0 ? "WALLET" : payment),
                isDp: 0,
                voucherKode: orderData.voucherCode || "",
                isDeleted: 0,
            };
            await tx.insert(paymentTable).values(paymentValues);
            logger.info("OrderService: Step F Success");

            logger.info("OrderService: All Steps Success - Committing Transaction", { orderId });

            return { success: true, orderId, totalAmount: totalTagihan, expiredTime: expiredTimeValue };
        });

        if (result.success) {
            (async () => {
                try {
                    const { orderId, totalAmount } = result;
                    const customerName = orderData.customerData?.namaCustomer || "Pelanggan";
                    const customerEmail = orderData.customerData?.emailCustomer || orderData.customerData?.email;

                    const emailPayload: any = {
                        orderId,
                        customerName,
                        totalTagihan: totalAmount,
                        statusOrder: statusOrder,
                        statusTagihan: finalBankAmount > 0 ? "BELUM BAYAR" : "BAYAR",
                        items: verifiedItems.map(item => ({
                            namaProduk: item.namaProduk,
                            size: item.size,
                            warna: item.warna,
                            variant: item.variant || "-",
                            qty: item.qty,
                            harga: item.harga
                        })),
                        shippingAddress: orderData.shipping?.address || "-"
                    };

                    // 1. Fetch Payment Info if it's a bank transfer
                    if (finalBankAmount > 0) {
                        const [bank]: any = await db.select()
                            .from(rekeningPembayaran)
                            .where(or(
                                eq(rekeningPembayaran.namaBank, orderData.payment),
                                like(rekeningPembayaran.namaBank, `%${orderData.payment}%`)
                            ))
                            .limit(1);

                        if (bank) {
                            emailPayload.paymentInfo = {
                                bankName: `Bank ${bank.namaBank}`,
                                bankAccount: bank.noRekening,
                                bankOwner: bank.namaPemilik
                            };
                        } else {
                            // Default Fallback
                            emailPayload.paymentInfo = {
                                bankName: "Transfer Bank BCA",
                                bankAccount: "2810377740",
                                bankOwner: "TRY SETYO UTOMO"
                            };
                        }
                    }

                    // 2. Admin Email
                    const adminEmail = await ConfigService.get("admin_email", process.env.SMTP_USER || "admin@enome.test");
                    await sendNewOrderAdminNotification(adminEmail, emailPayload);

                    // 3. Customer Email (if email exists)
                    if (customerEmail) {
                        await sendOrderConfirmationEmail(customerEmail, emailPayload);
                    }

                    // 4. Trigger Real-time Notification via Pusher
                    try {
                        const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalAmount);

                        await pusher.trigger("my-channel", "my-event", {
                            orderId,
                            customerName,
                            totalAmount,
                            totalAmountFormatted: formattedTotal,
                            title: "Pesanan Baru!",
                            message: `Pesanan ${orderId} dari ${customerName}. Total: ${formattedTotal}`
                        });
                    } catch (pusherError) {
                        console.error("Pusher trigger error:", pusherError);
                    }
                } catch (emailError) {
                    logger.error("OrderService: Failed to send notification emails", emailError);
                }
            })();
        }

        return result;
    }
}
