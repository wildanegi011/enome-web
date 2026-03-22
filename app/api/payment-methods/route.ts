import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rekeningPembayaran, orders, customer } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import logger, { apiLogger } from "@/lib/logger";
import { withOptionalAuth } from "@/lib/auth-utils";

/**
 * Mengambil daftar metode pembayaran (rekening bank/E-Wallet/Manual) yang aktif.
 * Jika user login, juga mengambil metode pembayaran terakhir yang digunakan.
 *
 * @auth optional
 * @method GET
 * @response 200 — { methods: RekeningPembayaran[], lastUsed: string | null }
 */
export const GET = withOptionalAuth(async (request: NextRequest, context: any, session: any) => {
    logger.debug("API Request: GET /api/payment-methods");

    try {
        // 1. Ambil semua metode pembayaran yang aktif
        const methods = await db.select()
            .from(rekeningPembayaran)
            .where(eq(rekeningPembayaran.isAktif, 1));

        let lastUsed = null;

        // 2. Jika user login, cari metode pembayaran terakhir dari order sebelumnya
        if (session?.user?.id) {
            try {
                // Cari custId di tabel customer yang link ke userId
                const [customerData] = await db.select({ custId: customer.custId })
                    .from(customer)
                    .where(eq(customer.userId, Number(session.user.id)))
                    .limit(1);

                if (customerData?.custId) {
                    const [lastOrder] = await db.select({ metodebayar: orders.metodebayar })
                        .from(orders)
                        .where(eq(orders.customer, customerData.custId))
                        .orderBy(desc(orders.timestamp))
                        .limit(1);

                    if (lastOrder?.metodebayar) {
                        const rawMethod = lastOrder.metodebayar.trim();
                        // Filter out generic values like WALLET or SPLIT if they don't map to a specific bank method
                        if (!["WALLET", "SPLIT"].includes(rawMethod.toUpperCase())) {
                            lastUsed = rawMethod;
                        }
                    }
                }
            } catch (authError) {
                logger.error("Error fetching last used payment method:", authError);
                // Continue without lastUsed if query fails
            }
        }

        return NextResponse.json({
            methods,
            lastUsed
        });
    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/payment-methods" });
        return NextResponse.json({ message: "error", error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
