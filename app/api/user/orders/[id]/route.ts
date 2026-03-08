import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    orders,
    orderdetail,
    produk,
    produkDetail,
    warna,
    rekeningPembayaran,
    statusOrder,
    statusTagihan,
    payment as paymentTable
} from "@/lib/db/schema";
import { eq, and, or, sql, like } from "drizzle-orm";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";
import { ConfigService } from "@/lib/services/config-service";

/**
 * Mengambil detail lengkap satu pesanan berdasarkan Order ID.
 * Mencakup data order, item produk, info pembayaran, dan info voucher.
 *
 * @auth required
 * @method GET
 * @params {{ id: string }} (order ID)
 * @response 200 — { order: Order, items: OrderItem[], paymentInfo?: BankInfo, voucherInfo?: VoucherInfo }
 * @response 401 — { message: "unauthorized" }
 * @response 404 — { message: "order not found" }
 * @response 500 — { message: "error", error: "Terjadi kesalahan sistem" }
 */

export const GET = withAuth(async (
    req: NextRequest,
    context: any,
    session: any
) => {
    try {
        const userId = session.user.id;
        const params = await context.params;
        const orderId = decodeURIComponent(params.id);
        const custId = await CustomerService.getCustId(userId);

        const userCondition = custId
            ? or(eq(orders.userId, userId.toString()), eq(orders.userId, custId))
            : eq(orders.userId, userId.toString());

        // 1. Fetch Master Order with simple joins
        const [order]: any = await db.select({
            orderId: orders.orderId,
            tglOrder: orders.tglOrder,
            statusOrder: orders.statusOrder,
            statusTagihan: orders.statusTagihan,
            totalTagihan: orders.totalTagihan,
            totalHarga: orders.totalHarga,
            ongkir: orders.ongkir,
            biayalain: orders.biayalain,
            totalBerat: orders.totalBerat,
            metodebayar: orders.metodebayar,
            keterangan: orders.keterangan,
            namaPenerima: orders.namaPenerima,
            teleponPenerima: orders.teleponPenerima,
            alamatKirim: orders.alamatKirim,
            provinsiKirim: orders.provinsiKirim,
            kotaKirim: orders.kotaKirim,
            distrikKirim: orders.distrikKirim,
            noResi: orders.noResi,
            ekspedisi: orders.ekspedisi,
            service: orders.service,
            viaWallet: orders.viaWallet,
            viaBank: orders.viaBank,
            orderTipe: orders.orderTipe,
            catatanKhusus: orders.catatanKhusus,
            namaPengirim: orders.namaPengirim,
            teleponPengirim: orders.teleponPengirim,
            updatedAt: orders.updatedAt,
        })
            .from(orders)
            .where(and(eq(orders.orderId, orderId), userCondition as any))
            .limit(1);

        if (!order) {
            return NextResponse.json({ message: "order not found" }, { status: 404 });
        }

        // 2. Fetch Order Items with variant-specific images
        const items = await db.select({
            id: orderdetail.id,
            produkId: orderdetail.produkId,
            namaProduk: produk.namaProduk,
            gambar: sql<string>`COALESCE(
                (SELECT CONCAT('produk/', pd2.gambar) 
                 FROM produkdetail pd2 
                 WHERE pd2.produk_id = ${orderdetail.produkId} 
                   AND (pd2.warna = ${orderdetail.warna} OR pd2.warna = (SELECT w2.warna_id FROM warna w2 WHERE w2.warna = ${orderdetail.warna} LIMIT 1))
                   AND pd2.gambar IS NOT NULL AND pd2.gambar != '' 
                 LIMIT 1),
                CONCAT('produk_utama/', ${produk.gambar})
            )`.as('gambar'),




            ukuran: orderdetail.ukuran,
            warna: sql<string>`COALESCE(${warna.warna}, ${orderdetail.warna})`.as('warna'),
            harga: orderdetail.harga,
            qty: orderdetail.qty,
            variant: orderdetail.variant,
            jmlHarga: orderdetail.jmlHarga,
            catatan: orderdetail.catatan,
        })
            .from(orderdetail)
            .leftJoin(produk, eq(orderdetail.produkId, produk.produkId))
            .leftJoin(warna, or(
                eq(orderdetail.warna, warna.warnaId),
                eq(orderdetail.warna, warna.warna)
            ))
            .leftJoin(produkDetail, and(
                eq(orderdetail.produkId, produkDetail.produkId),
                eq(orderdetail.ukuran, produkDetail.size),
                eq(warna.warna, produkDetail.warnaId)
            ))
            .where(eq(orderdetail.orderId, orderId));

        // 3. Fetch Payment Details if applicable (e.g., Bank Transfer info)
        let paymentInfo = null;
        const isBcaTransfer = order.metodebayar && (
            order.metodebayar.toUpperCase().includes("BCA") ||
            order.metodebayar.toUpperCase().includes("MANUAL") ||
            order.metodebayar === "SPLIT"
        );

        if (isBcaTransfer) {
            const [bank]: any = await db.select()
                .from(rekeningPembayaran)
                .where(and(
                    eq(rekeningPembayaran.isAktif, 1),
                    or(
                        eq(rekeningPembayaran.namaBank, order.metodebayar),
                        like(rekeningPembayaran.namaBank, `%${order.metodebayar}%`)
                    )
                ))
                .limit(1);

            if (bank) {
                paymentInfo = bank;
            } else {
                // Fallback to first active bank if specific match fails
                const banks = await db.select().from(rekeningPembayaran).where(eq(rekeningPembayaran.isAktif, 1)).limit(1);
                if (banks.length > 0) {
                    paymentInfo = banks[0];
                }
            }
        }

        // 4. Fetch Voucher Info from payment table
        let voucherInfo = null;
        let uniqueCode = 0;
        const [paymentRow]: any = await db.select({
            voucherKode: paymentTable.voucherKode,
            voucherNominal: paymentTable.voucherNominal,
            uniqueCode: paymentTable.uniqueCode,
            expiredTime: paymentTable.expiredTime,
        })
            .from(paymentTable)
            .where(like(paymentTable.paymentTransactionId, `%${orderId}%`))
            .limit(1);

        if (paymentRow && paymentRow.voucherKode && paymentRow.voucherKode.trim() !== "") {
            voucherInfo = {
                kode: paymentRow.voucherKode,
                nominal: paymentRow.voucherNominal || 0,
            };
        }

        if (paymentRow && paymentRow.uniqueCode && paymentRow.uniqueCode !== "0") {
            uniqueCode = parseInt(paymentRow.uniqueCode) || 0;
        }

        logger.info("Order Detail: Fetch success", { userId, orderId });
        return NextResponse.json({
            order,
            items,
            paymentInfo,
            voucherInfo,
            uniqueCode,
            expiredTime: paymentRow?.expiredTime,
            whatsappAdmin: await ConfigService.get("whatsapp_nomor", "628997179308"),
        });

    } catch (error: any) {
        apiLogger.error(req, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
