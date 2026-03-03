import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    orders,
    orderdetail,
    produk,
    rekeningPembayaran,
    statusOrder,
    statusTagihan,
    payment as paymentTable
} from "@/lib/db/schema";
import { eq, and, or, sql, like } from "drizzle-orm";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";

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

        // 2. Fetch Order Items
        const items = await db.select({
            id: orderdetail.id,
            produkId: orderdetail.produkId,
            namaProduk: produk.namaProduk,
            gambar: produk.gambar,
            ukuran: orderdetail.ukuran,
            warna: orderdetail.warna,
            harga: orderdetail.harga,
            qty: orderdetail.qty,
            jmlHarga: orderdetail.jmlHarga,
            catatan: orderdetail.catatan,
        })
            .from(orderdetail)
            .leftJoin(produk, eq(orderdetail.produkId, produk.produkId))
            .where(eq(orderdetail.orderId, orderId));

        // 3. Fetch Payment Details if applicable (e.g., Bank Transfer info)
        let paymentInfo = null;
        const isBcaTransfer = order.metodebayar && (
            order.metodebayar.toUpperCase().includes("BCA") ||
            order.metodebayar.toUpperCase().includes("MANUAL") ||
            order.metodebayar === "SPLIT"
        );

        if (isBcaTransfer) {
            const banks = await db.select().from(rekeningPembayaran).where(eq(rekeningPembayaran.isAktif, 1)).limit(1);
            if (banks.length > 0) {
                paymentInfo = banks[0];
            }
        }

        // 4. Fetch Voucher Info from payment table
        let voucherInfo = null;
        let uniqueCode = 0;
        const [paymentRow]: any = await db.select({
            voucherKode: paymentTable.voucherKode,
            voucherNominal: paymentTable.voucherNominal,
            uniqueCode: paymentTable.uniqueCode,
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
        });

    } catch (error: any) {
        apiLogger.error(req, error);
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
