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
    payment as paymentTable,
    provinsi,
    kota,
    kecamatan,
    voucher as voucherTable
} from "@/lib/db/schema";
import { eq, and, or, sql, like } from "drizzle-orm";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { CustomerService } from "@/lib/services/customer-service";
import { ConfigService } from "@/lib/services/config-service";
import { formatJakartaISO } from "@/lib/date-utils";

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
            // Map IDs back to Names for frontend display if they happen to be IDs
            provinsiName: provinsi.province,
            cityName: kota.cityName,
            distrikName: kecamatan.subdistrictName,
        })
            .from(orders)
            .leftJoin(provinsi, eq(orders.provinsiKirim, provinsi.provinceId))
            .leftJoin(kota, eq(orders.kotaKirim, kota.cityId))
            .leftJoin(kecamatan, eq(orders.distrikKirim, kecamatan.subdistrictId))
            .where(and(eq(orders.orderId, orderId), userCondition as any))
            .limit(1);

        if (!order) {
            return NextResponse.json({ message: "order not found" }, { status: 404 });
        }

        // Apply mapping if joins successful
        if (order.provinsiName) order.provinsiKirim = order.provinsiName;
        if (order.cityName) order.kotaKirim = order.cityName;
        if (order.distrikName) order.distrikKirim = order.distrikName;

        // 2. Fetch Order Items with variant-specific images
        const items = await db.select({
            id: orderdetail.id,
            produkId: orderdetail.produkId,
            namaProduk: produk.namaProduk,
            gambar: sql<string>`COALESCE(
                (SELECT CONCAT('produk/', pi2.gambar) 
                 FROM produk_image pi2 
                 LEFT JOIN warna w3 ON (pi2.warna = w3.warna OR pi2.warna = w3.warna_id)
                 WHERE pi2.produk_id = ${orderdetail.produkId} 
                   AND (pi2.warna = ${orderdetail.warna} OR w3.warna_id = ${orderdetail.warna} OR w3.warna = ${orderdetail.warna})
                 ORDER BY pi2.id ASC
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
            .where(eq(orderdetail.orderId, orderId))
            .groupBy(
                orderdetail.id,
                produk.namaProduk,
                produk.gambar,
                warna.warna
            );

        // 3. Fetch Payment Details if applicable (e.g., Bank Transfer info)
        let paymentInfo = null;
        const isManualBankTransfer = order.metodebayar && (
            order.viaBank === 1 || 
            !order.metodebayar.toUpperCase().includes("WALLET")
        );

        if (isManualBankTransfer) {
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
            syaratDanKetentuan: voucherTable.syaratDanKetentuan,
        })
            .from(paymentTable)
            .leftJoin(voucherTable, eq(paymentTable.voucherKode, voucherTable.kodeVoucher))
            .where(like(paymentTable.paymentTransactionId, `%${orderId}%`))
            .limit(1);

        if (paymentRow && paymentRow.voucherKode && paymentRow.voucherKode.trim() !== "") {
            voucherInfo = {
                kode: paymentRow.voucherKode,
                nominal: paymentRow.voucherNominal || 0,
                syarat_dan_ketentuan: paymentRow.syaratDanKetentuan,
            };
        }

        if (paymentRow && paymentRow.uniqueCode && paymentRow.uniqueCode !== "0") {
            uniqueCode = parseInt(paymentRow.uniqueCode) || 0;
        }

        logger.info("Order Detail: Fetch success", { userId, orderId });
        const response = {
            ...order,
            updatedAt: order.updatedAt ? formatJakartaISO(new Date(order.updatedAt)) : null,
            vouchers: []
        };

        return NextResponse.json({
            order: {
                ...order,
                updatedAt: order.updatedAt ? formatJakartaISO(new Date(order.updatedAt)) : null
            },
            items,
            paymentInfo,
            voucherInfo,
            uniqueCode,
            expiredTime: paymentRow?.expiredTime ? formatJakartaISO(new Date(paymentRow.expiredTime)) : null,
            whatsappAdmin: await ConfigService.get("whatsapp_nomor", "628997279308"),
            paymentVerificationTimeout: await ConfigService.getInt("PAYMENT_VERIFICATION_TIMEOUT_MINS", CONFIG.PAYMENT_VERIFICATION_TIMEOUT_MINS),
            trackableCouriers: await ConfigService.getTrackableCouriers(),
        });

    } catch (error: any) {
        apiLogger.error(req, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
