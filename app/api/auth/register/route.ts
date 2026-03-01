import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { user, customer, customerAlamat } from "@/lib/db/schema";
import { randomBytes } from "crypto";
import { eq, or, sql, and, desc, like, notLike } from "drizzle-orm";
import { execSync } from "child_process";
import { sendActivationEmail } from "@/lib/mail";
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
            username,
            email,
            password,
            nama_lengkap,
            no_hp,
            provinsi,
            kota,
            kecamatan,
            kode_pos,
            alamat_lengkap
        } = body;

        const trimmedEmail = email?.trim().toLowerCase();
        const trimmedUsername = username?.trim().toLowerCase();
        const trimmedNama = nama_lengkap?.trim();

        logger.info("Auth Request: Extended registration attempt", { email: trimmedEmail, username: trimmedUsername });

        // Validasi input
        if (!trimmedEmail || !password || !trimmedNama || !trimmedUsername || !no_hp || !alamat_lengkap) {
            logger.warn("Auth Warning: Missing registration fields", { email: trimmedEmail });
            return NextResponse.json({ error: "Semua data wajib harus diisi" }, { status: 400 });
        }

        // Cek apakah email atau username sudah terdaftar di tabel user
        const existingUsers = await db.select().from(user).where(
            or(eq(user.email, trimmedEmail), eq(user.username, trimmedUsername))
        );

        if (existingUsers.length > 0) {
            const conflict = existingUsers[0].email === trimmedEmail ? "Email" : "Username";
            logger.warn(`Auth Warning: ${conflict} already registered in user table`, { email: trimmedEmail, username: trimmedUsername });
            return NextResponse.json({ error: `${conflict} sudah terdaftar` }, { status: 400 });
        }

        // Cek apakah email sudah terdaftar di tabel customer (untuk antisipasi orphaned records)
        const existingCustomers = await db.select().from(customer).where(
            eq(customer.email, trimmedEmail)
        );

        if (existingCustomers.length > 0) {
            logger.warn(`Auth Warning: Email already registered in customer table`, { email: trimmedEmail });
            return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
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
                username: trimmedUsername,
                email: trimmedEmail,
                passwordHash: passwordHash,
                authKey: authKey,
                nama: trimmedNama,
                role: 2, // Customer
                status: 10, // Active
                isDeleted: 2, // Pending Verification
                verificationToken: verificationToken,
                createdAt: now,
                updatedAt: now,
                alamat: alamat_lengkap,
                photo: "",
                urlphoto: "",
                updatephoto: "",
            });

            const insertedUserId = userResult.insertId;
            const custId = await getNextCustId();

            // 2. Simpan ke tabel customer
            await tx.insert(customer).values({
                custId: custId,
                namaCustomer: trimmedNama,
                userId: insertedUserId,
                email: trimmedEmail,
                telp: no_hp,
                alamat: alamat_lengkap.substring(0, 50),
                alamatLengkap: alamat_lengkap.substring(0, 50),
                namaToko: "",
                kecamatan: kecamatan || "",
                kota: kota || "",
                provinsi: provinsi || "",
                kodepos: kode_pos || "",
                kategoriCustomerId: 4, // Default to Pelanggan
                completedDepositTime: sql`CURRENT_TIMESTAMP`,
                isDeleted: 0,
            });

            // 3. Simpan ke tabel customer_alamat (Alamat Utama)
            await tx.insert(customerAlamat).values({
                custId: custId,
                labelAlamat: "Utama",
                namaPenerima: trimmedNama,
                alamatLengkap: alamat_lengkap,
                noHandphone: no_hp,
                kecamatan: kecamatan || "",
                kota: kota || "",
                provinsi: provinsi || "",
                kodePos: kode_pos || "",
                isPrimary: 1,
                createdAt: sql`CURRENT_TIMESTAMP`,
                createdBy: insertedUserId,
            });
        });

        // Kirim email aktivasi dalam background menggunakan after()
        const activationLink = `${process.env.NEXT_PUBLIC_URL}/verify-email?token=${verificationToken}`;

        after(async () => {
            logger.info("Background job: Sending activation email", { email: trimmedEmail });
            await sendActivationEmail(trimmedEmail, activationLink);
        });

        logger.info("Auth Success: Extended registration completed, activation email queued in background", { email: trimmedEmail });
        return NextResponse.json({
            message: "Registrasi berhasil. Silakan cek email Anda untuk aktivasi akun."
        }, { status: 201 });

    } catch (error: any) {
        apiLogger.error(request, error, { route: "/api/auth/register" });
        return NextResponse.json({ error: "Terjadi kesalahan sistem saat mendaftar" }, { status: 500 });
    }
}

