import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { user, customer, customerAlamat } from "@/lib/db/schema";
import { randomBytes } from "crypto";
import { eq, or, sql, and, desc, like, notLike } from "drizzle-orm";
import { execSync } from "child_process";
import { sendActivationEmail } from "@/lib/mail";
import { getJakartaDate } from "@/lib/date-utils";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Logika generate cust_id sesuai dengan fungsi buatkode di PHP legacy
 * @param lastId ID terakhir dari database (misal: C2505151399)
 * @param key Prefix kunci (misal: "C")
 * @param padding Jumlah karakter nomor (padding nol di depan)
 */
function buatkode(lastId: string, key: string, padding: number) {
    const lastNum = parseInt(lastId.substring(key.length)) || 0;
    const nextNum = lastNum + 1;
    const nextId = key + nextNum.toString().padStart(padding, "0");
    return nextId;
}

async function getNextCustId() {
    const lastCustomer = await db.select({ custId: customer.custId })
        .from(customer)
        .where(
            and(
                like(customer.custId, 'C%'),
                notLike(customer.custId, 'CUST-%')
            )
        )
        .orderBy(desc(customer.custId))
        .limit(1);

    const key = "C";
    const padding = 10;
    const lastId = lastCustomer.length > 0 ? lastCustomer[0].custId : `${key}${"0".repeat(padding)}`;

    return buatkode(lastId, key, padding);
}

/**
 * Registrasi pengguna baru.
 * Mencakup validasi input, pengecekan email, hashing password via PHP, dan penyimpanan database.
 * Otomatis membuat record di tabel `user`, `customer`, dan `customer_alamat`.
 *
 * @auth none
 * @method POST
 * @body {{ username, email, password, nama_lengkap, no_hp, provinsi, kota, kecamatan, kode_pos, alamat_lengkap }}
 * @response 201 — { message: "Registrasi berhasil. Silakan cek email Anda untuk aktivasi akun." }
 * @response 400 — { error: string } (validasi gagal / email sudah terdaftar)
 * @response 500 — { error: "Terjadi kesalahan sistem saat mendaftar" }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            password,
            nama_toko,
            telp,
            no_hp,
            alamat,
            alamat_lengkap,
            kecamatan,
            kota,
            provinsi,
            kodepos,
            kode_pos
        } = body;

        const effectiveTelp = telp || no_hp || "";
        const effectiveKodepos = kodepos || kode_pos || "";
        const effectiveAlamat = alamat || alamat_lengkap || "";

        const username = Math.random().toString(36).substring(2, 10);
        const trimmedEmail = email?.trim().toLowerCase();

        logger.info("Auth Request: Simple registration attempt", { email: trimmedEmail, username: username });

        // Validasi input
        if (!trimmedEmail || !password || !username) {
            logger.warn("Auth Warning: Missing registration fields", { email: trimmedEmail });
            return NextResponse.json({ error: "Username, email, dan password wajib diisi" }, { status: 400 });
        }

        // Cek apakah email atau username sudah terdaftar di tabel user
        const existingUsers = await db.select().from(user).where(
            or(eq(user.email, trimmedEmail), eq(user.username, username))
        );

        // Find an active user with same email or username
        const activeUser = existingUsers.find(u => u.isDeleted !== 1);

        if (activeUser) {
            const conflict = activeUser.email === trimmedEmail ? "Email" : "Username";
            logger.warn(`Auth Warning: ${conflict} already registered and active`, { email: trimmedEmail, username: username });
            return NextResponse.json({ error: `${conflict} sudah terdaftar` }, { status: 400 });
        }

        // Cek apakah email sudah terdaftar di tabel customer
        const existingCustomers = await db.select().from(customer).where(
            eq(customer.email, trimmedEmail)
        );

        let inheritedCustomer = null;
        if (existingCustomers.length > 0) {
            // Check if this customer is linked to an active user
            const linkedUserId = existingCustomers[0].userId;
            if (linkedUserId) {
                const linkedUser = await db.select().from(user).where(eq(user.id, linkedUserId)).limit(1);
                if (linkedUser.length > 0 && linkedUser[0].isDeleted !== 1) {
                    logger.warn(`Auth Warning: Email already registered in customer table and linked to active user`, { email: trimmedEmail });
                    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
                }
            }
            // If we reached here, it's either orphaned (userId is null) or linked to a deleted user
            inheritedCustomer = existingCustomers[0];
            logger.info("Auth Info: Inheriting orphaned/deleted linked customer record", { email: trimmedEmail });
        }

        // Hash password menggunakan PHP
        const b64Password = Buffer.from(password).toString('base64');
        const phpCmd = `php -r 'echo password_hash(base64_decode("${b64Password}"), PASSWORD_BCRYPT, ["cost" => 13]);'`;

        let passwordHash = "";
        try {
            passwordHash = execSync(phpCmd).toString().trim();
        } catch (e: any) {
            logger.error("Auth Error: PHP hash failure", { error: e.message, email: trimmedEmail });
            return NextResponse.json({ error: "Gagal memproses password" }, { status: 500 });
        }

        const authKey = randomBytes(16).toString("hex");
        const verificationToken = randomBytes(32).toString("hex");
        const now = Math.floor(Date.now() / 1000);

        // Eksekusi transaksi untuk menjamin integritas data
        await db.transaction(async (tx) => {
            // 1. Simpan ke tabel user
            const [userResult]: any = await tx.insert(user).values({
                username: username,
                email: trimmedEmail,
                passwordHash: passwordHash,
                authKey: authKey,
                nama: name,
                role: 2, // Customer
                status: 10, // Active
                isDeleted: 2, // Pending Verification
                verificationToken: verificationToken,
                createdAt: now,
                updatedAt: now,
                alamat: "",
                photo: "",
                urlphoto: "",
                updatephoto: "",
            });

            const insertedUserId = userResult.insertId;

            if (inheritedCustomer) {
                // 2a. Update existing orphaned customer
                await tx.update(customer)
                    .set({
                        namaCustomer: name,
                        userId: insertedUserId,
                        isDeleted: 0,
                    })
                    .where(eq(customer.custId, inheritedCustomer.custId));
                logger.info("Auth Success: Updated orphaned customer record", { custId: inheritedCustomer.custId, userId: insertedUserId });
            } else {
                // 2b. Simpan ke tabel baru customer
                const custId = await getNextCustId();
                await tx.insert(customer).values({
                    custId: custId,
                    namaCustomer: name,
                    userId: insertedUserId,
                    email: trimmedEmail,
                    telp: effectiveTelp,
                    alamat: effectiveAlamat,
                    alamatLengkap: alamat_lengkap || "",
                    namaToko: nama_toko || "",
                    kecamatan: kecamatan || "",
                    kota: kota || "",
                    provinsi: provinsi || "",
                    kodepos: effectiveKodepos,
                    kategoriCustomerId: 4, // Default to Pelanggan
                    completedDepositTime: getJakartaDate(),
                    isDeleted: 0,
                });

                // 3. Simpan ke tabel customer_alamat (Alamat Utama)
                await tx.insert(customerAlamat).values({
                    custId: custId,
                    labelAlamat: "Utama",
                    namaPenerima: name,
                    alamatLengkap: alamat_lengkap || effectiveAlamat || "",
                    noHandphone: effectiveTelp,
                    kecamatan: kecamatan || "",
                    kota: kota || "",
                    provinsi: provinsi || "",
                    kodePos: effectiveKodepos,
                    namaToko: nama_toko || "",
                    isPrimary: 1,
                    createdAt: getJakartaDate(),
                    createdBy: insertedUserId,
                });
                logger.info("Auth Success: Created new customer record with address", { custId, userId: insertedUserId });
            }

        });

        // Kirim email aktivasi dalam background menggunakan after()
        const activationLink = `${process.env.NEXT_PUBLIC_URL}/verify-email?token=${verificationToken}`;

        // Log activity
        const { ActivityService } = await import("@/lib/services/activity-service");
        await ActivityService.log("Registration", `New user registered: ${name} (${trimmedEmail})`, undefined);

        logger.info("Auth Success: Simple registration completed, activation email queued in background", { email: trimmedEmail });
        return NextResponse.json({
            message: "Registrasi berhasil. Silakan cek email Anda untuk aktivasi akun."
        }, { status: 201 });

    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/auth/register" });
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat mendaftar" }, { status: 500 });
    }
}

