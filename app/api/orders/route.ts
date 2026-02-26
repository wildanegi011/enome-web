import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";
import { CONFIG } from "@/lib/config";
import { OrderService } from "@/lib/services/order-service";
import { CustomerService } from "@/lib/services/customer-service";
import { CartService } from "@/lib/services/cart-service";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            logger.warn("API Unauthorized: POST /api/orders");
            return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 });
        }

        const body = await request.json();
        logger.info("API Request: POST /api/orders", { body });

        const {
            shipping, payment, totalAmount, voucherCode,
            voucherDiscount, walletAmount, shippingPrice,
            specialNotes, resi, catatan, isDropshipper, dropshipper
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
        const { items: cartItems } = await CartService.getCartItems(userId);

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
        const packingFee = CONFIG.PACKING_FEE;
        const discountAmount = voucherDiscount || 0;
        let totalTagihan = totalAmount + shippingCost + packingFee - discountAmount;

        // 5. Generate Unique Code for BCA Transfer if applicable and add it to totalTagihan natively
        const isBcaTransfer = payment.toUpperCase().includes("BCA") && !payment.toUpperCase().includes("VIRTUAL");
        const uniqueCode = isBcaTransfer ? await OrderService.generateUniqueCode() : 0;

        totalTagihan += uniqueCode;

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

        // 6. Create Order
        const result: any = await OrderService.createOrder(orderData, stockResult.verifiedItems || [], finalWalletAmount, uniqueCode);

        // Add unique code and bank info to result for frontend
        if (uniqueCode > 0) {
            result.uniqueCode = uniqueCode;
            result.paymentMethod = "BCA";
            result.bankAccount = "2810377740";
            result.bankOwner = "TRYSETYO0603";
            result.bankName = "Bank BCA";
        }

        // Attach breakdown details for success page
        result.meta = orderData.meta;
        result.subtotal = totalAmount;

        return NextResponse.json(result);

    } catch (error: any) {
        logger.error("API Error: 500 /api/orders", { error: error.message, stack: error.stack });
        return NextResponse.json({ message: "error", desc: error.message }, { status: 500 });
    }
}
