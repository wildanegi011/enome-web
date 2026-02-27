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
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";
import { CustomerService } from "@/lib/services/customer-service";

export async function GET(
    req: NextRequest,
    context: any
) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }

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
        const [paymentRow]: any = await db.select({
            voucherKode: paymentTable.voucherKode,
            voucherNominal: paymentTable.voucherNominal,
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

        logger.info("Order Detail: Fetch success", { userId, orderId });
        return NextResponse.json({
            order,
            items,
            paymentInfo,
            voucherInfo
        });

    } catch (error: any) {
        logger.error("API Error: /api/user/orders/[id]", { error: error.message });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}
