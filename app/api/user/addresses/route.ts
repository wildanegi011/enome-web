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
            logger.info("API Response: 200 /api/user/addresses", { count: 0 });
            return NextResponse.json({ addresses: [] });
        }

        const addresses = await UserService.getAddresses(custId);

        logger.info("API Response: 200 /api/user/addresses", { count: addresses.length });
        return NextResponse.json({ addresses });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json(
            { message: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
});

/**
 * Menambahkan alamat pengiriman baru.
 * Jika isPrimary=1, alamat lain akan di-reset menjadi non-primary.
 *
 * @auth required
 * @method POST
 * @body {{ labelAlamat, namaPenerima, namaToko?, noHandphone, provinsi, kota, kecamatan, kodePos, alamatLengkap, isPrimary? }}
 * @response 200 — { success: true, message: string, addressId: number }
 * @response 401 — { error: "Sesi tidak valid" }
 * @response 404 — { error: "Profil customer tidak ditemukan" }
 * @response 500 — { error: "Gagal menyimpan alamat" }
 */
export const POST = withAuth(async (req: NextRequest, context: any, session: any) => {
    try {
        const body = await req.json();
        logger.info("API Request: POST /api/user/addresses", { body });

        const {
            labelAlamat,
            namaPenerima,
            namaToko,
            noHandphone,
            provinsi: prov,
            kota: kab,
            kecamatan: kec,
            kodePos,
            alamatLengkap,
            isPrimary
        } = body;

        // Mendapatkan data customer berdasarkan user yang login
        const [customerData]: any = await db.select()
            .from(customer)
            .where(eq(customer.userId, session.user.id))
            .limit(1);

        if (!customerData || !customerData.custId) {
            logger.warn("API Not Found: POST /api/user/addresses", { error: "Customer not found" });
            return NextResponse.json({ error: "Profil customer tidak ditemukan" }, { status: 404 });
        }

        // Tentukan label alamat
        const label = isPrimary ? "Alamat Utama" : (labelAlamat || "Alamat");

        // Jika alamat baru diset sebagai Utama, reset status Utama pada alamat lain milik customer ini
        if (isPrimary === 1) {
            await db.update(customerAlamat)
                .set({ isPrimary: 0 })
                .where(eq(customerAlamat.custId, customerData.custId as string));
        }

        // Menyimpan alamat baru ke database
        const [result]: any = await db.insert(customerAlamat).values({
            custId: customerData.custId,
            labelAlamat: label,
            namaPenerima,
            namaToko,
            alamatLengkap,
            noHandphone,
            provinsi: prov,
            kota: kab,
            kecamatan: kec,
            kodePos,
            isPrimary: isPrimary === 1 ? 1 : 0,
            createdBy: 1, // Sistem ID default
            createdAt: getJakartaDate(),
        });

        logger.info("API Response: 200 /api/user/addresses (POST)", { addressId: result.insertId });
        return NextResponse.json({
            success: true,
            message: "Alamat berhasil disimpan",
            addressId: result.insertId
        });
    } catch (error: any) {
        apiLogger.error(req, error);
        return NextResponse.json({ error: "Gagal menyimpan alamat" }, { status: 500 });
    }
});

/**
 * Menghapus alamat pengiriman berdasarkan ID.
 *
 * @auth required
 * @method DELETE
 * @body {{ id: number }}
 * @response 200 — { success: true, message: "Alamat berhasil dihapus" }
 * @response 401 — { error: "Sesi tidak valid" }
 * @response 500 — { error: "Gagal menghapus alamat" }
 */
export const DELETE = withAuth(async (req: NextRequest, context: any, session: any) => {
    try {
        const { id } = await req.json();
        logger.info("API Request: DELETE /api/user/addresses", { addressId: id });

        if (!id) return NextResponse.json({ error: "ID alamat diperlukan" }, { status: 400 });

        // Melakukan penghapusan alamat berdasarkan ID
        await db.delete(customerAlamat).where(eq(customerAlamat.id, id));

        logger.info("API Response: 200 /api/user/addresses (DELETE)", { addressId: id });
        return NextResponse.json({ success: true, message: "Alamat berhasil dihapus" });
    } catch (error: any) {
        apiLogger.error(req, error);
        return NextResponse.json({ error: "Gagal menghapus alamat" }, { status: 500 });
    }
});

/**
 * Memperbarui data alamat atau mengubah status Alamat Utama.
 *
 * @auth required
 * @method PATCH
 * @body {{ id: number, isPrimary?: 1, labelAlamat?, namaPenerima?, namaToko?, alamatLengkap?, noHandphone?, provinsi?, kota?, kecamatan?, kodePos? }}
 * @response 200 — { success: true, message: "Alamat berhasil diperbarui" }
 * @response 401 — { error: "Sesi tidak valid" }
 * @response 404 — { error: "Alamat tidak ditemukan" }
 * @response 500 — { error: "Gagal memperbarui alamat" }
 */
export const PATCH = withAuth(async (req: NextRequest, context: any, session: any) => {
    try {
        const body = await req.json();
        const { id, isPrimary, ...updates } = body;
        logger.info("API Request: PATCH /api/user/addresses", { addressId: id, isPrimary, updates });

        // Cari data alamat yang akan diperbarui
        const addr = await db.select().from(customerAlamat).where(eq(customerAlamat.id, id)).limit(1);
        if (addr.length === 0) {
            logger.warn("API Not Found: PATCH /api/user/addresses", { addressId: id });
            return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 });
        }

        // Jika update status menjadi Alamat Utama
        if (isPrimary) {
            const custId = addr[0].custId;
            if (custId) {
                // Reset alamat utama lama
                await db.update(customerAlamat)
                    .set({ isPrimary: 0 })
                    .where(eq(customerAlamat.custId, custId as string));
            }

            // Set alamat terpilih sebagai Utama
            await db.update(customerAlamat)
                .set({ isPrimary: 1, labelAlamat: "Alamat Utama" })
                .where(eq(customerAlamat.id, id));
        }

        // Jika ada perubahan data lainnya (selain status Primary)
        if (Object.keys(updates).length > 0) {
            const mappedUpdates: any = {};
            const availableFields: (keyof typeof updates)[] = [
                'labelAlamat', 'namaPenerima', 'namaToko',
                'alamatLengkap', 'noHandphone', 'provinsi',
                'kota', 'kecamatan', 'kodePos'
            ];

            availableFields.forEach(field => {
                if (updates[field] !== undefined) {
                    mappedUpdates[field === 'provinsi' ? 'provinsi' :
                        field === 'kota' ? 'kota' :
                            field === 'kecamatan' ? 'kecamatan' : field] = updates[field];
                }
            });

            if (Object.keys(mappedUpdates).length > 0) {
                await db.update(customerAlamat)
                    .set(mappedUpdates)
                    .where(eq(customerAlamat.id, id));
            }
        }

        logger.info("API Response: 200 /api/user/addresses (PATCH)", { addressId: id });
        return NextResponse.json({ success: true, message: "Alamat berhasil diperbarui" });
    } catch (error: any) {
        apiLogger.error(req, error);
        return NextResponse.json({ error: "Gagal memperbarui alamat" }, { status: 500 });
    }
});


