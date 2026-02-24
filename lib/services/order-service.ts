import { db } from "@/lib/db";
import {
    keranjang, orders, orderdetail, produkDetail,
    preOrder, wallet, voucher
} from "@/lib/db/schema";
import { eq, and, sql, desc, like } from "drizzle-orm";
import { CONFIG } from "@/lib/config";
import logger from "@/lib/logger";

export class OrderService {
    static async generateOrderId() {
        logger.info("OrderService: Generating Order ID");
        // ...
        const now = new Date();
        const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, "");
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
        return `${prefix}${nextIndex}`;
    }

    static async verifyStock(cartItems: any[]) {
        logger.info("OrderService: Verifying stock", { itemCount: cartItems.length });
        let totalWeight = 0;
        let totalHpp = 0;
        const verifiedItems: any[] = [];

        for (const item of cartItems) {
            const [detail]: any = await db.select()
                .from(produkDetail)
                .where(and(
                    eq(produkDetail.produkId, item.produkId!),
                    eq(produkDetail.warnaId, item.warna!),
                    eq(produkDetail.size, item.size!)
                ))
                .limit(1);

            // Use mapped field 'qty' or database field 'qtyProduk'
            const qty = item.qty || item.qtyProduk || 0;

            if (!detail || (detail.stokNormal || 0) < qty) {
                return {
                    success: false,
                    error: `Stok produk ${item.produkId} (${item.warna}, ${item.size}) tidak mencukupi.`
                };
            }

            totalWeight += (detail.berat || 0) * qty;
            totalHpp += (detail.hpp || 0) * qty;
            verifiedItems.push({ ...item, detail, qty });
        }

        return { success: true, verifiedItems, totalWeight, totalHpp };
    }

    static async createOrder(orderData: any, verifiedItems: any[], walletAdjustment: number) {
        logger.info("OrderService: Creating Order", { orderId: orderData.orderId, userId: orderData.userId });
        const now = new Date();
        const ymd = now.toISOString().split('T')[0];
        const dhms = now.toISOString().slice(0, 19).replace('T', ' ');

        const { orderId, userId, customerData, totalAmount, shipping, payment, costs, meta } = orderData;
        const { totalWeight, totalHpp } = costs;
        const { shippingCost, packingFee, discountAmount, totalTagihan, finalWalletAmount, finalBankAmount } = meta;

        // Check active pre-order
        const [activePreOrder]: any = await db.select().from(preOrder).where(eq(preOrder.isAktif, 1)).limit(1);
        const orderTipe = activePreOrder ? "PRE-ORDER" : "ORDER";
        const statusOrder = finalBankAmount <= 0 ? "PROSES PACKING" : "OPEN";

        return await db.transaction(async (tx) => {
            // A. Insert Master Order
            logger.info("OrderService: Step A - Inserting Master Order", { orderId });
            try {
                const orderValues: any = {
                    orderId,
                    customer: customerData.custId || null,
                    userId: userId.toString(),
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
                    noResi: orderData.resi || "",
                    keterangan: orderData.catatan || "",
                    metodebayar: finalWalletAmount > 0 && finalBankAmount > 0 ? "SPLIT" : (finalWalletAmount > 0 ? "WALLET" : payment),
                    orderTipe,
                    preorderId: activePreOrder?.preOrderId ? Number(activePreOrder.preOrderId) : null,
                    isReadyStok: activePreOrder ? 0 : 1,
                    catatanKhusus: orderData.specialNotes || null,
                    namaPengirim: orderData.isDropshipper ? (orderData.dropshipper?.name || "") : "SYLLA HIJAB",
                    teleponPengirim: orderData.isDropshipper ? (orderData.dropshipper?.phone || "") : "",
                    alamatPengirim: orderData.isDropshipper ? (orderData.dropshipper?.address || "") : "",
                    timestamp: sql`${dhms}`,
                    viaWallet: Math.round(finalWalletAmount),
                    viaBank: Math.round(finalBankAmount),
                    companyprofileId: CONFIG.DEFAULT_COMPANY_PROFILE_ID,
                    customerAlamatIdPenerima: Number(shipping.addressId) || 0,
                    shipto: (shipping.customerId && shipping.customerId !== 0 && shipping.customerId !== "0") ? shipping.customerId.toString() : (customerData.custId || ""),
                    provinsiKirim: shipping.provinsi || "",
                    kotaKirim: shipping.kota || "",
                    distrikKirim: shipping.kecamatan || "",
                    service: orderData.service || "",
                    kodeservice: orderData.service || "",
                    shipper: orderData.isDropshipper ? "PEMESAN" : "SYLLA HIJAB",
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
                const qty = item.qty || 0;
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
                    kategori: customerData.kategoriCustomer || ""
                };

                await tx.insert(orderdetail).values(detailValues);

                await tx.update(produkDetail)
                    .set({ stokNormal: sql`${produkDetail.stokNormal} - ${qty}` })
                    .where(eq(produkDetail.detailId, item.detail.detailId));
            }
            logger.info("OrderService: Step B Success");

            // C. Clear Cart
            logger.info("OrderService: Step C - Clearing Cart");
            await tx.update(keranjang)
                .set({ isDeleted: 1, updatedAt: sql`${dhms}` } as any)
                .where(and(eq(keranjang.custId, Number(userId)), eq(keranjang.isDeleted, 0)));
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

            // E. Voucher Update
            if (orderData.voucherCode) {
                logger.info("OrderService: Step E - Voucher Update", { voucherCode: orderData.voucherCode });
                await tx.update(voucher)
                    .set({ kuotaVoucher: sql`${voucher.kuotaVoucher} - 1` })
                    .where(eq(voucher.kodeVoucher, orderData.voucherCode));
                logger.info("OrderService: Step E Success");
            }

            logger.info("OrderService: All Steps Success - Committing Transaction", { orderId });

            return { success: true, orderId, totalAmount: totalTagihan };
        });
    }
}
