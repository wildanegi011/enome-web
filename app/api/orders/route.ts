import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { OrderService } from "@/lib/services/order-service";
import { CustomerService } from "@/lib/services/customer-service";
import { CartService } from "@/lib/services/cart-service";
import { ConfigService } from "@/lib/services/config-service";
import { db } from "@/lib/db";
import { rekeningPembayaran } from "@/lib/db/schema";
import { eq, like, or } from "drizzle-orm";

/**
 * Membuat order baru dari isi keranjang.
 * Alur: validasi session → ambil cart → verifikasi stok → generate order ID → hitung biaya → simpan order.
 *
 * @auth required
 * @method POST
 * @body {{ shipping, payment, totalAmount, voucherCode?, voucherDiscount?, walletAmount?, shippingPrice?, specialNotes?, resi?, catatan?, isDropshipper?, dropshipper? }}
 * @response 200 — { orderId, message: "success", meta: { totalTagihan, ... }, uniqueCode?, paymentMethod?, ... }
 * @response 400 — { message: string } (validasi gagal / stok habis)
 * @response 401 — { message: "Silakan login terlebih dahulu" }
 * @response 404 — { error: "Profil customer tidak ditemukan" }
 * @response 500 — { message: "error", desc: "Terjadi kesalahan sistem" }
 */
export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
    try {
        const body = await request.json();
        logger.info("API Request: POST /api/orders", { body });

        const {
            shipping, payment, totalAmount, voucherCode,
            voucherDiscount, walletAmount, shippingPrice,
            specialNotes, resi, catatan, isDropshipper, dropshipper,
            itemIds
        } = body;

        if (!shipping || !payment) {
            return NextResponse.json({ message: "Data pengiriman dan pembayaran diperlukan" }, { status: 400 });
        }

        const userId = session.user.id;
        const customerData = await CustomerService.getCustomerData(userId);

        if (!customerData) {
            logger.warn("Order Error: Customer not found", { userId });
            return NextResponse.json({ error: "Profil customer tidak ditemukan" }, { status: 404 });
        }

        // 1. Fetch Cart Items using CartService
        const { items: cartItems } = await CartService.getCartItems(userId, itemIds);

        if (cartItems.length === 0) {
            logger.warn("Order Error: Cart is empty", { userId });
            return NextResponse.json({ message: "Keranjang belanja kosong" }, { status: 400 });
        }

        // 2. Verify Stock
        const stockResult = await OrderService.verifyStock(cartItems);
        if (!stockResult.success) {
            logger.warn("Order Error: Stock verification failed", { userId, error: stockResult.error });
            return NextResponse.json({ message: "error", desc: stockResult.error }, { status: 400 });
        }

        // 3. Generate Order ID
        const orderId = await OrderService.generateOrderId();

        // 4. Calculate Meta & Logic Restoration
        const shippingCost = shippingPrice || 0;
        // Try biaya_packing first, then packing_fee as fallback
        let packingFee = await ConfigService.getInt("biaya_packing", -1);
        if (packingFee === -1) {
            packingFee = await ConfigService.getInt("biaya_packing", CONFIG.PACKING_FEE);
        }
        const discountAmount = voucherDiscount || 0;
        let totalTagihan = totalAmount + shippingCost + packingFee - discountAmount;

        // 5. Generate Unique Code for BCA Transfer
        //    targetCode = 3 digit terakhir total (displayed to user)
        //    adjustment = amount added to base to achieve those 3 digits
        const isTransferPayment = payment.toUpperCase().includes("BCA") ||
            payment.toUpperCase().includes("MANUAL") ||
            payment.toUpperCase().includes("TRANSFER") ||
            payment === "SPLIT";
        let uniqueCode = 0;
        let uniqueAdjustment = 0;

        if (isTransferPayment) {
            const result = await OrderService.generateUniqueCode(totalTagihan);
            uniqueCode = result.targetCode;       // 3 digit terakhir (100-999)
            uniqueAdjustment = result.adjustment;  // actual charge (100-999)
        }

        totalTagihan += uniqueAdjustment;

        const finalWalletAmount = Math.min(walletAmount || 0, totalTagihan);
        const finalBankAmount = totalTagihan - finalWalletAmount;

        const isSpecialCourier = ["jtr", "cod", "instantkurir", "pickup", "cashless", "gratis"].includes(shipping.courier?.toLowerCase());
        const serviceName = isSpecialCourier ? shipping.courier?.toLowerCase() : (shipping.service?.split(";")[0] || "");

        // Restore voucher info to keterangan
        const finalKeterangan = voucherCode
            ? `${catatan || ""} (Voucher: ${voucherCode} -${discountAmount})`.trim()
            : (catatan || "");

        // Unique code was already calculated and added to totalTagihan above

        const orderData = {
            ...body,
            orderId,
            userId,
            customerData,
            catatan: finalKeterangan,
            resi: resi || (isSpecialCourier ? shipping.service : ""),
            costs: { totalWeight: stockResult.totalWeight, totalHpp: stockResult.totalHpp },
            meta: { shippingCost, packingFee, discountAmount, totalTagihan, finalWalletAmount, finalBankAmount },
            service: serviceName
        };

        // 6. Create Order — pass targetCode as uniqueCode for display in keterangan
        const result: any = await OrderService.createOrder(orderData, stockResult.verifiedItems || [], finalWalletAmount, uniqueCode);

        // Add unique code and bank info to result for frontend
        if (isTransferPayment) {
            result.uniqueCode = uniqueCode;

            // Fetch Bank Details dynamically
            const [bank]: any = await db.select()
                .from(rekeningPembayaran)
                .where(or(
                    eq(rekeningPembayaran.namaBank, payment),
                    like(rekeningPembayaran.namaBank, `%${payment}%`)
                ))
                .limit(1);

            if (bank) {
                result.paymentMethod = bank.namaBank;
                result.bankAccount = bank.noRekening;
                result.bankOwner = bank.namaPemilik;
                result.bankName = `Bank ${bank.namaBank}`;
                result.bankLogo = bank.logoBank ? `rekening_pembayaran/${bank.logoBank}` : "rekening_pembayaran/bca.png";
            } else {
                // Fallback if not found in DB
                result.paymentMethod = payment;
                result.bankAccount = "2810377740";
                result.bankOwner = "TRYSETYO0603";
                result.bankName = "Bank BCA";
                result.bankLogo = "rekening_pembayaran/bca.png";
            }

        }

        // Attach breakdown details for success page
        result.meta = orderData.meta;
        result.subtotal = totalAmount;
        result.whatsappAdmin = await ConfigService.get("whatsapp_nomor", "628997179308");

        console.log("API POST /api/orders response:", result);
        return NextResponse.json(result);

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "error", desc: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
