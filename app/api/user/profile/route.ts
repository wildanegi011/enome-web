import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, customer, customerKategori, customerAlamat } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";

/**
 * Handler untuk mengambil data profil lengkap user.
 * Melakukan join antara tabel user, customer, kategori customer, dan alamat.
 */
export async function GET(request: NextRequest) {
    logger.info("API Request: GET /api/user/profile");
    try {
        const session = await getSession();
        if (!session || !session.user) {
            logger.warn("Profile Check: Unauthorized access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Query data profil gabungan
        const profileData = await db.select({
            id: user.id,
            username: user.username,
            email: user.email,
            nama: user.nama,
            kodeCustomer: customer.custId,
            namaTipeCustomer: customerKategori.namaTipeCustomer,
            namaToko: customerAlamat.namaToko,
            noHandphone: customerAlamat.noHandphone,
        })
            .from(user)
            .leftJoin(customer, eq(user.id, customer.userId))
            .leftJoin(customerKategori, eq(customer.kategoriCustomerId, customerKategori.id))
            .leftJoin(customerAlamat, eq(customer.custId, customerAlamat.custId))
            .where(eq(user.id, userId))
            .limit(1);

        if (profileData.length === 0) {
            logger.warn("Profile Check: User data not found", { userId });
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Menambahkan placeholder voucher (untuk pengembangan mendatang)
        const response = {
            ...profileData[0],
            vouchers: []
        };

        logger.info("Profile Check: Data fetched successfully", { userId });
        return NextResponse.json(response);

    } catch (error: any) {
        logger.error("API Error: /api/user/profile", { error: error.message });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

