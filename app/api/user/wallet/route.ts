import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wallet, customer } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";

/**
 * Handler untuk mendapatkan saldo wallet terakhir milik user.
 * Mencari custId terlebih dahulu lalu mengambil record saldo terbaru dari tabel wallet.
 */
export async function GET() {
    logger.info("API Request: GET /api/user/wallet");
    try {
        const session = await getSession();
        if (!session) {
            logger.warn("Wallet Check: Unauthorized access attempt");
            return NextResponse.json({ message: "login" }, { status: 401 });
        }

        const userId = session.user.id;

        // Mencari custId yang berelasi dengan userId ini
        const [customerData]: any = await db.select({ custId: customer.custId })
            .from(customer)
            .where(eq(customer.userId, userId))
            .limit(1);

        if (!customerData) {
            logger.info("Wallet Check: Customer profile not found, returning 0 balance");
            return NextResponse.json({ balance: 0 });
        }

        // Mengambil transaksi wallet terakhir untuk mendapatkan saldo terkini
        const [lastWallet]: any = await db.select()
            .from(wallet)
            .where(eq(wallet.custId, customerData.custId))
            .orderBy(desc(wallet.id))
            .limit(1);

        const balance = lastWallet?.saldo || 0;

        logger.info("Wallet Check: Balance fetched successfully", { userId, balance });
        return NextResponse.json({ balance });
    } catch (error: any) {
        logger.error("API Error: /api/user/wallet", { error: error.message });
        return NextResponse.json({ message: "error", error: error.message }, { status: 500 });
    }
}

