import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { user, customer, customerKategori, customerAlamat } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";
import { ActivityService } from "@/lib/services/activity-service";
import { promises as fs } from "fs";
import { join } from "path";

/**
 * Mengambil data profil lengkap user yang sedang login.
 * Join dengan tabel customer dan customer_kategori untuk data member.
 *
 * @auth required
 * @method GET
 * @response 200 — { id, username, email, nama, kodeCustomer, namaTipeCustomer, noHandphone, gender, brithdate, photo, vouchers }
 * @response 401 — { error: "Unauthorized" }
 * @response 404 — { error: "User not found" }
 * @response 500 — { error: "Terjadi kesalahan sistem" }
 */
export const GET = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: GET /api/user/profile");
    try {
        const userId = session.user.id;

        const profileData = await db.select({
            id: user.id,
            username: user.username,
            email: user.email,
            nama: user.nama,
            kodeCustomer: customer.custId,
            namaTipeCustomer: customerKategori.namaTipeCustomer,
            namaToko: customerAlamat.namaToko,
            noHandphone: customerAlamat.noHandphone,
            gender: user.gender,
            brithdate: user.brithdate,
            photo: user.photo,
            urlphoto: user.urlphoto,
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

        const response = {
            ...profileData[0],
            vouchers: []
        };

        logger.info("Profile Check: Data fetched successfully", { userId });
        return NextResponse.json(response);

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});

/**
 * Memperbarui data profil user (nama, gender, tanggal lahir, no HP, foto).
 * Mendukung upload foto via FormData.
 *
 * @auth required
 * @method POST
 * @body FormData {{ nama, gender, brithdate?, noHandphone?, photo?: File }}
 * @response 200 — { success: true, message: "Profil berhasil diperbarui" }
 * @response 401 — { error: "Unauthorized" }
 * @response 500 — { error: "Terjadi kesalahan sistem" }
 */
export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.info("API Request: POST /api/user/profile");
    try {
        const userId = session.user.id;
        const formData = await request.formData();

        const nama = formData.get("nama") as string;
        const gender = formData.get("gender") as string;
        const brithdateStr = formData.get("brithdate") as string;
        const noHandphone = formData.get("noHandphone") as string;
        const photo = formData.get("photo") as File | null;

        // New fields
        const namaToko = formData.get("namaToko") as string;
        const alamat = formData.get("alamat") as string;
        const alamatLengkap = formData.get("alamatLengkap") as string;
        const kecamatan = formData.get("kecamatan") as string;
        const kota = formData.get("kota") as string;
        const provinsi = formData.get("provinsi") as string;
        const kodepos = formData.get("kodepos") as string;

        // Convert brithdate string to Date object or null
        const brithdate = brithdateStr ? new Date(brithdateStr) : null;

        // 1. Update User Table
        await db.update(user)
            .set({
                nama: nama,
                gender: parseInt(gender),
                brithdate: brithdate,
                updatedAt: Math.floor(Date.now() / 1000)
            })
            .where(eq(user.id, userId));

        // 2. Update Customer Table
        await db.update(customer)
            .set({
                namaCustomer: nama,
                namaToko: namaToko || undefined,
                telp: noHandphone || undefined,
                alamat: alamat || undefined,
                alamatLengkap: alamatLengkap || undefined,
                kecamatan: kecamatan || undefined,
                kota: kota || undefined,
                provinsi: provinsi || undefined,
                kodepos: kodepos || undefined,
            })
            .where(eq(customer.userId, userId));

        // 3. Update Phone Number and Shop Name in Primary Customer Alamat
        const customerData = await db.select({ custId: customer.custId })
            .from(customer)
            .where(eq(customer.userId, userId))
            .limit(1);

        if (customerData.length > 0) {
            // Update Primary Address
            await db.update(customerAlamat)
                .set({
                    noHandphone: noHandphone || undefined,
                    namaToko: namaToko || undefined,
                    alamatLengkap: alamatLengkap || undefined,
                    kecamatan: kecamatan || undefined,
                    kota: kota || undefined,
                    provinsi: provinsi || undefined,
                    kodePos: kodepos || undefined,
                })
                .where(and(
                    eq(customerAlamat.custId, customerData[0].custId),
                    eq(customerAlamat.isPrimary, 1)
                ));
        }

        let photoUpdated = false;
        // 3. Handle Photo Upload (Matching PHP Logic)
        if (photo && photo.size > 0) {
            const ext = photo.name.split('.').pop() || "jpg";
            const fileName = `${userId}.${ext}`;
            const buffer = Buffer.from(await photo.arrayBuffer());

            const uploadDir = join(process.cwd(), "public/img/user");

            // Ensure directory exists with proper permissions (0o755)
            await fs.mkdir(uploadDir, { recursive: true });
            try {
                await fs.chmod(uploadDir, 0o755);
            } catch (chmodError) {
                logger.warn("Profile Photo: Failed to set directory permissions", { uploadDir, error: chmodError });
            }

            const filePath = join(uploadDir, fileName);
            await fs.writeFile(filePath, buffer);

            const assetUrl = process.env.NEXT_PUBLIC_URL || "";
            const fullUrl = `${assetUrl}/img/user/${fileName}`;

            await db.update(user)
                .set({
                    photo: fileName,
                    urlphoto: fullUrl
                })
                .where(eq(user.id, userId));

            photoUpdated = true;
            logger.info("Profile Photo: Updated successfully", { userId, fileName });
        }

        if (photoUpdated) {
            await ActivityService.log("Update Profile Photo", `User updated profile picture`, userId);
        }
        await ActivityService.log("Update Profile", `User updated profile data (nama, gender, brithdate)`, userId);

        logger.info("Profile Update: Success", { userId });
        return NextResponse.json({ success: true, message: "Profil berhasil diperbarui" });

    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
});
