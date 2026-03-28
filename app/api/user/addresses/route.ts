import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customer, customerAlamat } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { getJakartaDate } from "@/lib/date-utils";
import { CustomerService } from "@/lib/services/customer-service";
import { UserService } from "@/lib/services/user-service";

/**
 * Mengambil daftar alamat pengiriman customer yang login.
 *
 * @auth required
 * @method GET
 * @response 200 — { addresses: Address[] }
 * @response 401 — { message: "Unauthorized" }
 * @response 500 — { message: "Terjadi kesalahan sistem" }
 */
export const GET = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/user/addresses");
    try {
        const userId = session.user.id;
        const custId = await CustomerService.getCustId(userId);

        if (!custId) {
            return NextResponse.json({ addresses: [] });
        }

        const addresses = await UserService.getAddresses(custId);
        return NextResponse.json({ addresses });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ message: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});

export const POST = withAuth(async (req: NextRequest, context: any, session: any) => {
    try {
        const body = await req.json();
        logger.info("API Request: POST /api/user/addresses", { body });

        const addressId = await UserService.addAddress(session.user.id, body);

        return NextResponse.json({
            success: true,
            message: "Alamat berhasil disimpan",
            addressId
        });
    } catch (error: any) {
        apiLogger.error(req, error);
        return NextResponse.json({ error: error.message || "Gagal menyimpan alamat" }, { status: 500 });
    }
});

export const DELETE = withAuth(async (req: NextRequest, context: any, session: any) => {
    try {
        const { id } = await req.json();
        logger.info("API Request: DELETE /api/user/addresses", { addressId: id });

        if (!id) return NextResponse.json({ error: "ID alamat diperlukan" }, { status: 400 });

        await UserService.deleteAddress(id);

        return NextResponse.json({ success: true, message: "Alamat berhasil dihapus" });
    } catch (error: any) {
        apiLogger.error(req, error);
        return NextResponse.json({ error: "Gagal menghapus alamat" }, { status: 500 });
    }
});

export const PATCH = withAuth(async (req: NextRequest, context: any, session: any) => {
    try {
        const body = await req.json();
        const { id, ...data } = body;
        logger.info("API Request: PATCH /api/user/addresses", { addressId: id, data });

        await UserService.updateAddress(id, data);

        return NextResponse.json({ success: true, message: "Alamat berhasil diperbarui" });
    } catch (error: any) {
        apiLogger.error(req, error);
        return NextResponse.json({ error: error.message || "Gagal memperbarui alamat" }, { status: 500 });
    }
});


