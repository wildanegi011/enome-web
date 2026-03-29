import { db } from "@/lib/db";
import { voucher, customer } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import logger from "@/lib/logger";
import { getJakartaDate, formatJakarta } from "@/lib/date-utils";

export class VoucherService {
    /**
     * Validates a voucher code for a given subtotal and order type.
     */
    static async validateVoucher(kode: string, subtotal: number, userId: number, orderTipe?: number | string) {
        const now = getJakartaDate();

        // 1. Get customer data for eligibility check
        const [customerData]: any = await db.select({
            custId: customer.custId,
            kategoriCustomerId: customer.kategoriCustomerId
        })
            .from(customer)
            .where(eq(customer.userId, userId))
            .limit(1);

        if (!customerData) {
            return { success: 0, message: "Data customer tidak ditemukan" };
        }

        // 2. Find active voucher in valid date range
        const [voucherData]: any = await db.select()
            .from(voucher)
            .where(and(
                sql`LOWER(${voucher.kodeVoucher}) = LOWER(${kode})`,
                eq(voucher.isAktif, 1),
                sql`(${voucher.tanggalMulai} IS NULL OR ${now} >= ${voucher.tanggalMulai})`,
                sql`(${voucher.tanggalKadaluarsa} IS NULL OR ${now} <= ${voucher.tanggalKadaluarsa})`
            ))
            .limit(1);

        if (!voucherData) {
            const [existingVoucher]: any = await db.select({
                isAktif: voucher.isAktif,
            })
                .from(voucher)
                .where(sql`LOWER(${voucher.kodeVoucher}) = LOWER(${kode})`)
                .limit(1);

            if (!existingVoucher) {
                return { success: 0, message: `Voucher ${kode} tidak ditemukan` };
            }
            if (existingVoucher.isAktif !== 1) {
                return { success: 0, message: `Voucher ${kode} sudah tidak tersedia` };
            }
            return { success: 0, message: `Voucher ${kode} sudah tidak tersedia (kadaluarsa)` };
        }

        // 3. Validate Quota
        if (voucherData.kuotaVoucher !== null && voucherData.kuotaVoucher <= 0) {
            return { success: 0, message: `Kuota Voucher ${kode} habis!` };
        }

        // 4. Validate Min Transaction
        if (voucherData.minimalTransaksi && subtotal < voucherData.minimalTransaksi) {
            return {
                success: 0,
                message: `Minimal Transaksi untuk Voucher ${kode} adalah Rp ${new Intl.NumberFormat("id-ID").format(voucherData.minimalTransaksi)}`
            };
        }

        // 5. Validate Order Type
        const orderTipeMap: { [key: number]: string } = { 1: "ORDER", 2: "PRE-ORDER" };
        const requestedOrderTipe = typeof orderTipe === 'number' ? orderTipeMap[orderTipe] : (orderTipe || "ORDER");

        if (voucherData.orderTipe && voucherData.orderTipe.trim() !== "") {
            const allowedOrderTipes = voucherData.orderTipe.split(",").map((t: string) => t.trim().toUpperCase());
            if (allowedOrderTipes.length > 0 && !allowedOrderTipes.includes(requestedOrderTipe.toUpperCase())) {
                return { success: 0, message: `Voucher ${kode} hanya berlaku untuk tipe order tertentu!` };
            }
        }

        // 6. Validate Customer Eligibility
        if (voucherData.custId && voucherData.custId.trim() !== "") {
            const allowedCustIds = voucherData.custId.split(",").map((id: string) => id.trim());
            if (allowedCustIds.length > 0 && !allowedCustIds.includes(customerData.custId)) {
                return { success: 0, message: `Voucher ${kode} hanya berlaku untuk customer tertentu` };
            }
        }

        // 7. Validate Category Eligibility
        if (voucherData.kategoriCustomerId && voucherData.kategoriCustomerId.trim() !== "") {
            const allowedKategoriIds = voucherData.kategoriCustomerId.split(",").map((id: string) => id.trim());
            if (allowedKategoriIds.length > 0 && !allowedKategoriIds.includes(String(customerData.kategoriCustomerId))) {
                return { success: 0, message: `Voucher ${kode} hanya berlaku untuk tipe member tertentu!` };
            }
        }

        return {
            success: 1,
            message: `Voucher ${kode} berhasil digunakan!`,
            nilai_voucher: voucherData.nilaiVoucher,
            tipe_voucher: voucherData.tipeVoucher,
            maksimal_nominal_voucher_persen: voucherData.maksimalNominalVoucherPersen,
            syarat_dan_ketentuan: voucherData.syaratDanKetentuan
        };
    }

    /**
     * Finds the best auto-apply voucher for a subtotal and user.
     */
    static async findAutoApplyVoucher(subtotal: number, userId: number, orderTipe?: number | string) {
        const now = getJakartaDate();

        // 1. Get customer for eligibility
        const [customerData]: any = await db.select({
            custId: customer.custId,
            kategoriCustomerId: customer.kategoriCustomerId
        })
            .from(customer)
            .where(eq(customer.userId, userId))
            .limit(1);

        if (!customerData) return null;

        const orderTipeMap: { [key: string]: string } = { "1": "ORDER", "2": "PRE-ORDER", "ORDER": "ORDER", "PRE-ORDER": "PRE-ORDER" };
        const requestedOrderTipe = orderTipeMap[String(orderTipe).toUpperCase()] || "ORDER";

        // 2. Find all eligible auto-apply vouchers
        const vouchersData: any[] = await db.select()
            .from(voucher)
            .where(and(
                eq(voucher.autoApply, 1),
                eq(voucher.isAktif, 1),
                sql`(${voucher.tanggalMulai} IS NULL OR ${formatJakarta(now, 'full')} >= ${voucher.tanggalMulai})`,
                sql`(${voucher.tanggalKadaluarsa} IS NULL OR ${formatJakarta(now, 'full')} <= ${voucher.tanggalKadaluarsa})`
            ));

        let bestVoucher = null;
        let maxDiscount = -1;

        for (const v of vouchersData) {
            // Validation Logic (same as validateVoucher but returns boolean instead of message)

            // Quota
            if (v.kuotaVoucher !== null && v.kuotaVoucher <= 0) continue;

            // Min Transaction
            if (v.minimalTransaksi && subtotal < v.minimalTransaksi) continue;

            // Order Type
            if (v.orderTipe && v.orderTipe.trim() !== "") {
                const allowedOrderTipes = v.orderTipe.split(",").map((t: string) => t.trim().toUpperCase());
                if (allowedOrderTipes.length > 0 && !allowedOrderTipes.includes(requestedOrderTipe.toUpperCase())) continue;
            }

            // Customer Eligibility
            if (v.custId && v.custId.trim() !== "") {
                const allowedCustIds = v.custId.split(",").map((id: string) => id.trim());
                if (allowedCustIds.length > 0 && !allowedCustIds.includes(customerData.custId)) continue;
            }

            // Category Eligibility
            if (v.kategoriCustomerId && v.kategoriCustomerId.trim() !== "") {
                const allowedKategoriIds = v.kategoriCustomerId.split(",").map((id: string) => id.trim());
                if (allowedKategoriIds.length > 0 && !allowedKategoriIds.includes(String(customerData.kategoriCustomerId))) continue;
            }

            // Calculate Discount
            let discount = 0;
            const type = v.tipeVoucher?.toUpperCase();
            if (type === "NOMINAL") {
                discount = v.nilaiVoucher || 0;
            } else if (type === "PERSEN") {
                discount = (subtotal * (v.nilaiVoucher || 0)) / 100;
                if (v.maksimalNominalVoucherPersen > 0) {
                    discount = Math.min(discount, v.maksimalNominalVoucherPersen);
                }
            }

            if (discount > maxDiscount) {
                maxDiscount = discount;
                bestVoucher = {
                    kode: v.kodeVoucher,
                    nilai_voucher: v.nilaiVoucher,
                    tipe_voucher: v.tipeVoucher,
                    maksimal_nominal_voucher_persen: v.maksimalNominalVoucherPersen,
                    syarat_dan_ketentuan: v.syaratDanKetentuan,
                    discount_amount: discount
                };
            }
        }

        return bestVoucher;
    }
}
