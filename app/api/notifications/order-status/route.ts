import { db } from "@/lib/db";
import { orders, user as userTable, customer as customerTable, orderdetail as orderDetailTable, produk } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendOrderStatusUpdateEmail } from "@/lib/mail";
import logger from "@/lib/logger";

/**
 * API to send order status change notifications via email.
 * This endpoint is intended to be called when an order status is updated.
 * 
 * @method POST
 * @payload { orderId: string, status: string }
 */
export async function POST(req: Request) {
    try {
        const apiKey = req.headers.get("x-api-key");
        const expectedSecret = process.env.JWT_SECRET;

        if (expectedSecret && apiKey !== expectedSecret) {
            logger.warn("Unauthorized notification attempt", {
                ip: req.headers.get("x-forwarded-for") || "unknown",
                hasApiKey: !!apiKey
            });
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json({
                success: false,
                error: "Missing orderId or status"
            }, { status: 400 });
        }

        logger.info(`Notification API: Triggering email for Order ${orderId}, Status: ${status}`);

        // Fetch order, customer and user data
        // join logic: orders.userId = customer.custId, then customer.userId = user.id
        const [data]: any = await db.select({
            orderId: orders.orderId,
            statusOrder: orders.statusOrder,
            noResi: orders.noResi,
            ekspedisi: orders.ekspedisi,
            customerName: customerTable.namaCustomer,
            email: userTable.email,
        })
            .from(orders)
            .leftJoin(customerTable, eq(orders.userId, customerTable.custId))
            .leftJoin(userTable, eq(customerTable.userId, userTable.id))
            .where(eq(orders.orderId, orderId))
            .limit(1);

        if (!data) {
            logger.warn(`Notification API: Order ${orderId} not found or no associated user.`);
            return NextResponse.json({
                success: false,
                error: "Order not found or no associated user"
            }, { status: 404 });
        }

        if (!data.email) {
            logger.warn(`Notification API: User for Order ${orderId} does not have an email address.`);
            return NextResponse.json({
                success: false,
                error: "User email not found"
            }, { status: 400 });
        }

        // Fetch Order Items
        const items = await db.select({
            namaProduk: produk.namaProduk,
            produkId: orderDetailTable.produkId,
            size: orderDetailTable.ukuran,
            warna: orderDetailTable.warna,
            qty: orderDetailTable.qty,
            harga: orderDetailTable.harga,
            variant: orderDetailTable.variant
        })
            .from(orderDetailTable)
            .leftJoin(produk, eq(orderDetailTable.produkId, produk.produkId))
            .where(eq(orderDetailTable.orderId, orderId));

        // Use status from payload if provided, fallback to DB status
        const effectiveStatus = status || data.statusOrder;

        // Trigger email in background
        (async () => {
            try {
                await sendOrderStatusUpdateEmail(data.email, {
                    orderId: data.orderId,
                    customerName: data.customerName || "Pelanggan",
                    status: effectiveStatus,
                    noResi: data.noResi,
                    ekspedisi: data.ekspedisi,
                    items: items.map(item => ({
                        ...item,
                        namaProduk: item.namaProduk || item.produkId
                    }))
                });
            } catch (err) {
                logger.error(`Background Email Notification Failed for Order ${orderId}:`, err);
            }
        })();

        return NextResponse.json({
            success: true,
            message: "Notification trigger accepted"
        });

    } catch (error: any) {
        logger.error("API Notification Order Status Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
