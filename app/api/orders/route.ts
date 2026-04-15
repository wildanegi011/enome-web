import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { OrderService } from "@/lib/services/order-service";
import { CustomerService } from "@/lib/services/customer-service";
import { CartService } from "@/lib/services/cart-service";
import { ConfigService } from "@/lib/services/config-service";
import { ShippingService } from "@/lib/services/shipping-service";
import { db } from "@/lib/db";
import { rekeningPembayaran } from "@/lib/db/schema";
import { eq, like, or } from "drizzle-orm";
import { ActivityService } from "@/lib/services/activity-service";

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
            shipping, payment, paymentId, totalAmount, voucherCode,
            voucherDiscount, walletAmount, shippingPrice,
            specialNotes, resi, catatan, isDropshipper, dropshipper,
            itemIds, uniqueCode
        } = body;

        if (!shipping || !payment) {
            return NextResponse.json({ message: "Data pengiriman dan pembayaran diperlukan" }, { status: 400 });
        }

        const userId = session.user.id;
        const customerData = await CustomerService.ensureCustomerData(
            userId,
            session.user.name || "Customer",
            session.user.email
        );

        if (!customerData) {
            logger.error("Order Error: Failed to provision customer record", { userId });
            return NextResponse.json({ error: "Gagal memproses data profile customer" }, { status: 500 });
        }

        // 1. Fetch Cart Items using CartService
        const { items: cartItems } = await CartService.getCartItems(userId, itemIds);

        if (cartItems.length === 0) {
            logger.warn("Order Error: Cart is empty", { userId });
            return NextResponse.json({ message: "Keranjang belanja kosong" }, { status: 400 });
        }

        // Recalculate totalAmount (subtotal) on server to prevent client-side manipulation / expired price usage
        const serverTotalAmount = Math.round(cartItems.reduce((acc, item) => acc + (Number(item.harga || 0) * Number(item.qty || 0)), 0));

        // 2. Verify Stock
        const stockResult = await OrderService.verifyStock(cartItems);
        if (!stockResult.success) {
            logger.warn("Order Error: Stock verification failed", { userId, issues: stockResult.issues });
            return NextResponse.json({
                message: "error",
                desc: stockResult.error,
                issues: stockResult.issues
            }, { status: 400 });
        }

        // 3. Generate Order ID
        const orderId = await OrderService.generateOrderId();

        // 4. Validate Shipping Price (Double Validation)
        const destination = shipping.districtId || shipping.kecamatan;
        const shippingValidation = await ShippingService.validateShipping({
            destination: destination,
            weight: stockResult.totalWeight || 0,
            courier: shipping.courier,
            service: shipping.service,
            claimedPrice: shippingPrice || 0
        });

        if (!shippingValidation.valid) {
            if ((shippingValidation as any).error) {
                return NextResponse.json({ message: "error", desc: (shippingValidation as any).error }, { status: 400 });
            }
            // If just price mismatch, we could either error out or auto-adjust. 
            // Better to error out to inform the user about price change.
            return NextResponse.json({
                message: "error",
                desc: "Harga ongkos kirim telah berubah. Silakan muat ulang halaman checkout untuk mendapatkan harga terbaru."
            }, { status: 400 });
        }

        const shippingCost = shippingValidation.actualPrice;
        // Try biaya_packing first, then packing_fee as fallback
        let packingFee = await ConfigService.getInt("biaya_packing", -1);
        if (packingFee === -1) {
            packingFee = await ConfigService.getInt("biaya_packing", 0);
        }

        const discountAmount = voucherDiscount || 0;
        let baseTagihan = serverTotalAmount + shippingCost + packingFee - discountAmount;

        const isTransferPayment = payment.toLowerCase() !== "wallet";

        let uniqueCodeFinal = 0;
        let totalTagihan = baseTagihan;

        if (isTransferPayment) {
            if (body.uniqueCode && !isNaN(parseInt(body.uniqueCode))) {
                uniqueCodeFinal = parseInt(body.uniqueCode);
            } else {
                const result = await OrderService.generateUniqueCode(baseTagihan);
                uniqueCodeFinal = result.targetCode;
            }
            totalTagihan = baseTagihan + uniqueCodeFinal;
        }

        logger.info("Order total calculation details:", {
            base: baseTagihan,
            uniqueCode: uniqueCodeFinal,
            final: totalTagihan
        });

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
            totalAmount: serverTotalAmount,
            orderId,
            userId,
            customerData,
            catatan: finalKeterangan,
            resi: resi || (isSpecialCourier ? shipping.service : ""),
            costs: { totalWeight: stockResult.totalWeight, totalHpp: stockResult.totalHpp },
            meta: {
                shippingCost,
                packingFee,
                discountAmount,
                totalTagihan,
                finalWalletAmount,
                finalBankAmount
            },
            service: serviceName
        };

        let bankData: any = null;
        if (isTransferPayment) {
            // Use paymentId (precise lookup by primary key) if available
            if (paymentId) {
                const [bank]: any = await db.select()
                    .from(rekeningPembayaran)
                    .where(eq(rekeningPembayaran.id, Number(paymentId)))
                    .limit(1);
                bankData = bank;
            }
            // Fallback: name-based matching for backward compatibility
            if (!bankData) {
                const [bank]: any = await db.select()
                    .from(rekeningPembayaran)
                    .where(or(
                        eq(rekeningPembayaran.namaBank, payment),
                        like(rekeningPembayaran.namaBank, `%${payment}%`)
                    ))
                    .limit(1);
                bankData = bank;
            }
        }

        // 6. Create Order — pass targetCode as uniqueCode for display in keterangan
        const result: any = await OrderService.createOrder(orderData, stockResult.verifiedItems || [], finalWalletAmount, uniqueCodeFinal, bankData);

        // Add unique code and bank info to result for frontend
        if (isTransferPayment) {
            result.uniqueCode = uniqueCodeFinal;

            if (bankData) {
                result.paymentMethod = bankData.namaBank;
                result.bankAccount = bankData.noRekening;
                result.bankOwner = bankData.namaPemilik;
                result.bankName = bankData.namaBank.toUpperCase().includes("BANK") ? bankData.namaBank : `Bank ${bankData.namaBank}`;
                result.bankLogo = bankData.logoBank ? `rekening_pembayaran/${bankData.logoBank}` : "rekening_pembayaran/bca.png";
            } else {
                // Fallback if not found in DB
                result.paymentMethod = payment;
                result.bankAccount = "-";
                result.bankOwner = "-";
                result.bankName = payment;
                result.bankLogo = "rekening_pembayaran/bca.png";
            }

        }

        // Attach breakdown details for success page
        result.meta = orderData.meta;
        result.subtotal = serverTotalAmount;
        result.shippingPrice = shippingCost;
        result.packingFee = packingFee;
        result.voucherDiscount = discountAmount;
        result.whatsappAdmin = await ConfigService.get("whatsapp_nomor", "628997279308");
        result.paymentVerificationTimeout = await ConfigService.getInt("PAYMENT_VERIFICATION_TIMEOUT_MINS", CONFIG.PAYMENT_VERIFICATION_TIMEOUT_MINS);

        await ActivityService.log("Place Order", `User ${session.user.name} created order ${orderId} with total ${totalTagihan}`, userId);

        console.log("API POST /api/orders response:", result);
        return NextResponse.json(result);

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "error", desc: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
