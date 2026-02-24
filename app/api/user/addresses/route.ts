import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, customer, customerAlamat, orders, provinsi, kota, kecamatan } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";

/**
 * Handler untuk mengambil daftar alamat pengiriman customer.
 */
export async function GET(request: NextRequest) {
    logger.info("API Request: GET /api/user/addresses");
    try {
        // Mendapatkan sesi user yang sedang login
        const session = await getSession();
        if (!session) {
            logger.warn("API Unauthorized: GET /api/user/addresses");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Mendapatkan informasi customer berdasarkan userId
        const customerInfo = await db.select({ custId: customer.custId })
            .from(customer)
            .where(eq(customer.userId, userId))
            .limit(1);

        if (customerInfo.length === 0) {
            logger.info("API Response: 200 /api/user/addresses", { count: 0 });
            return NextResponse.json({ addresses: [] });
        }

        const custId = customerInfo[0].custId;

        // Mengambil data alamat dari tabel customerAlamat
        const legacyAddresses = await db.select({
            id: customerAlamat.id,
            customerId: customerAlamat.custId,
            name: customerAlamat.namaPenerima,
            address: customerAlamat.alamatLengkap,
            phone: customerAlamat.noHandphone,
            label: customerAlamat.labelAlamat,
            kelurahan: customerAlamat.kelurahan,
            kecamatan: customerAlamat.kecamatan,
            kota: customerAlamat.kota,
            provinsi: customerAlamat.provinsi,
            kodePos: customerAlamat.kodePos,
            namaToko: customerAlamat.namaToko,
            isPrimary: customerAlamat.isPrimary,
        })
            .from(customerAlamat)
            .where(eq(customerAlamat.custId, custId))
            .orderBy(desc(customerAlamat.id));

        // Memetakan data alamat ke format yang lebih bersih untuk frontend
        const addresses = legacyAddresses.map(addr => ({
            id: addr.id,
            label: addr.label || "Alamat",
            receiverName: addr.name || "",
            phoneNumber: addr.phone || "",
            fullAddress: addr.address || "",
            city: addr.kota || "",
            province: addr.provinsi || "",
            district: addr.kecamatan || "",
            postalCode: addr.kodePos || "",
            shopName: addr.namaToko || "",
            isPrimary: addr.isPrimary,
            type: addr.isPrimary === 1 ? "Utama" : "Alamat Tersimpan"
        }));

        logger.info("API Response: 200 /api/user/addresses", { count: addresses.length });
        return NextResponse.json({ addresses });

    } catch (error: any) {
        // Penanganan error jika gagal mengambil data alamat
        logger.error("API Error: 500 /api/user/addresses", { error: error.message });
        return NextResponse.json(
            { message: "Gagal mengambil data alamat", error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Handler untuk menambahkan alamat pengiriman baru.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.user?.id) {
            logger.warn("API Unauthorized: POST /api/user/addresses");
            return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
        }

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
            createdAt: new Date(),
        });

        logger.info("API Response: 200 /api/user/addresses (POST)", { addressId: result.insertId });
        return NextResponse.json({
            success: true,
            message: "Alamat berhasil disimpan",
            addressId: result.insertId
        });
    } catch (error: any) {
        logger.error("API Error: 500 /api/user/addresses (POST)", { error: error.message });
        return NextResponse.json({ error: "Gagal menyimpan alamat" }, { status: 500 });
    }
}

/**
 * Handler untuk menghapus alamat pengiriman.
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            logger.warn("API Unauthorized: DELETE /api/user/addresses");
            return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
        }

        const { id } = await req.json();
        logger.info("API Request: DELETE /api/user/addresses", { addressId: id });

        if (!id) return NextResponse.json({ error: "ID alamat diperlukan" }, { status: 400 });

        // Melakukan penghapusan alamat berdasarkan ID
        await db.delete(customerAlamat).where(eq(customerAlamat.id, id));

        logger.info("API Response: 200 /api/user/addresses (DELETE)", { addressId: id });
        return NextResponse.json({ success: true, message: "Alamat berhasil dihapus" });
    } catch (error: any) {
        logger.error("API Error: 500 /api/user/addresses (DELETE)", { error: error.message });
        return NextResponse.json({ error: "Gagal menghapus alamat" }, { status: 500 });
    }
}

/**
 * Handler untuk memperbarui data alamat atau mengubah status Alamat Utama.
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            logger.warn("API Unauthorized: PATCH /api/user/addresses");
            return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
        }

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
        logger.error("API Error: 500 /api/user/addresses (PATCH)", { error: error.message });
        return NextResponse.json({ error: "Gagal memperbarui alamat" }, { status: 500 });
    }
}


