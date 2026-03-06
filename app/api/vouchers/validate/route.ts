import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { voucher, customer } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { getJakartaDate } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/utils";

/**
 * Validasi kode voucher.
 * Mengecek ketersediaan, masa berlaku, kuota, minimal transaksi,
 * tipe order (ORDER/PRE-ORDER), dan eligibilitas customer/kategori.
 *
 * @auth required
 * @method POST
 * @body {{ kode: string, subtotal: number, order_tipe?: number|string }}
 * @response 200 (valid)   — { success: 1, message: string, nilai_voucher, tipe_voucher, maksimal_nominal_voucher_persen }
 * @response 200 (invalid) — { success: 0, message: string }
 * @response 500 — { success: 0, message: "Terjadi kesalahan sistem saat validasi voucher" }
 */
export const POST = withAuth(async (req: Request, context: any, session: any) => {
    try {
        const body = await req.json();
        const { kode, subtotal, order_tipe } = body;

        logger.info("Voucher Request: Validation attempt", { kode, subtotal, order_tipe, userId: session?.user?.id });

        if (!kode) {
            logger.warn("Voucher Warning: Missing code");
            return NextResponse.json({ success: 0, message: "Kode voucher harus diisi" });
        }

        const userId = session.user.id;
        const now = getJakartaDate();

        // Ambil data customer untuk validasi eligibilitas voucher
        const [customerData]: any = await db.select({
            custId: customer.custId,
            kategoriCustomerId: customer.kategoriCustomerId
        })
            .from(customer)
            .where(eq(customer.userId, userId))
            .limit(1);

        if (!customerData) {
            logger.warn("Voucher Warning: Customer data not found", { userId });
            return NextResponse.json({ success: 0, message: "Data customer tidak ditemukan" });
        }

        // Cari voucher yang aktif DAN masih dalam masa berlaku (cek tanggal langsung di SQL)
        const [voucherData]: any = await db.select()
            .from(voucher)
            .where(and(
                sql`LOWER(${voucher.kodeVoucher}) = LOWER(${kode})`,
                eq(voucher.isAktif, 1),
                sql`(${voucher.tanggalMulai} IS NULL OR NOW() >= ${voucher.tanggalMulai})`,
                sql`(${voucher.tanggalKadaluarsa} IS NULL OR NOW() <= ${voucher.tanggalKadaluarsa})`
            ))
            .limit(1);

        if (!voucherData) {
            // Cek apakah voucher ada tapi sudah kadaluarsa / belum mulai
            const [existingVoucher]: any = await db.select({
                kodeVoucher: voucher.kodeVoucher,
                tanggalMulai: voucher.tanggalMulai,
                tanggalKadaluarsa: voucher.tanggalKadaluarsa,
                isAktif: voucher.isAktif,
            })
                .from(voucher)
                .where(sql`LOWER(${voucher.kodeVoucher}) = LOWER(${kode})`)
                .limit(1);

            if (!existingVoucher) {
                logger.info("Voucher Check: Voucher not found", { kode });
                return NextResponse.json({ success: 0, message: `Voucher ${kode} tidak ditemukan` });
            }
            if (existingVoucher.isAktif !== 1) {
                logger.info("Voucher Check: Voucher inactive", { kode });
                return NextResponse.json({ success: 0, message: `Voucher ${kode} tidak aktif` });
            }
            logger.info("Voucher Check: Expired or not started", { kode, start: existingVoucher.tanggalMulai, end: existingVoucher.tanggalKadaluarsa });
            return NextResponse.json({ success: 0, message: `Voucher ${kode} sudah tidak tersedia (kadaluarsa)` });
        }

        // Validasi Kuota
        if (voucherData.kuotaVoucher !== null && voucherData.kuotaVoucher <= 0) {
            logger.info("Voucher Check: Quota exhausted", { kode });
            return NextResponse.json({ success: 0, message: `Kuota Voucher ${kode} habis!` });
        }

        // Validasi Minimal Transaksi
        if (voucherData.minimalTransaksi && subtotal < voucherData.minimalTransaksi) {
            logger.info("Voucher Check: Subtotal too low", { kode, subtotal, required: voucherData.minimalTransaksi });
            return NextResponse.json({
                success: 0,
                message: `Minimal Transaksi untuk Voucher ${kode} adalah ${formatCurrency(voucherData.minimalTransaksi)}`
            });
        }

        // Validasi Tipe Order (ORDER/PRE-ORDER)
        const orderTipeMap: { [key: number]: string } = { 1: "ORDER", 2: "PRE-ORDER" };
        const requestedOrderTipe = typeof order_tipe === 'number' ? orderTipeMap[order_tipe] : (order_tipe || "ORDER");

        if (voucherData.orderTipe && voucherData.orderTipe.trim() !== "") {
            const allowedOrderTipes = voucherData.orderTipe.split(",").map((t: string) => t.trim().toUpperCase());
            if (allowedOrderTipes.length > 0 && !allowedOrderTipes.includes(requestedOrderTipe.toUpperCase())) {
                logger.info("Voucher Check: Order type mismatch", { kode, orderTipe: requestedOrderTipe });
                return NextResponse.json({ success: 0, message: `Voucher ${kode} hanya berlaku untuk tipe order tertentu!` });
            }
        }

        // Validasi Eligibilitas Customer (Berdasarkan custId spesifik jika ada)
        if (voucherData.custId && voucherData.custId.trim() !== "") {
            const allowedCustIds = voucherData.custId.split(",").map((id: string) => id.trim());
            if (allowedCustIds.length > 0 && !allowedCustIds.includes(customerData.custId)) {
                logger.info("Voucher Check: Customer not in allowlist", { kode, custId: customerData.custId });
                return NextResponse.json({ success: 0, message: `Voucher ${kode} hanya berlaku untuk customer tertentu` });
            }
        }

        // Validasi Eligibilitas Kategori Customer (Role/Level Member)
        if (voucherData.kategoriCustomerId && voucherData.kategoriCustomerId.trim() !== "") {
            const allowedKategoriIds = voucherData.kategoriCustomerId.split(",").map((id: string) => id.trim());
            if (allowedKategoriIds.length > 0 && !allowedKategoriIds.includes(String(customerData.kategoriCustomerId))) {
                logger.info("Voucher Check: Category mismatch", { kode, kategoriId: customerData.kategoriCustomerId });
                return NextResponse.json({ success: 0, message: `Voucher ${kode} hanya berlaku untuk tipe member tertentu!` });
            }
        }

        logger.info("Voucher Success: Validated", { kode, value: voucherData.nilaiVoucher });
        return NextResponse.json({
            success: 1,
            message: `Voucher ${kode} berhasil digunakan!`,
            nilai_voucher: voucherData.nilaiVoucher,
            tipe_voucher: voucherData.tipeVoucher,
            maksimal_nominal_voucher_persen: voucherData.maksimalNominalVoucherPersen
        });

    } catch (error: any) {
        apiLogger.error(null, error, { route: "/api/vouchers/validate" });
        return NextResponse.json({ success: 0, message: "Terjadi kesalahan sistem saat validasi voucher" }, { status: 500 });
    }
});
