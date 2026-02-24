import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { execSync } from "child_process";
import logger from "@/lib/logger";

/**
 * Handler untuk registrasi pengguna baru.
 * Mencakup validasi input, pengecekan email, hashing password via PHP, dan penyimpanan database.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nama, email, password } = body;
        const trimmedEmail = email?.trim().toLowerCase(); // Normalisasi email ke lowercase
        const trimmedNama = nama?.trim();

        logger.info("Auth Request: Registration attempt", { email: trimmedEmail });

        // Validasi input dasar
        if (!trimmedEmail || !password || !trimmedNama) {
            logger.warn("Auth Warning: Missing registration fields", { email: trimmedEmail });
            return NextResponse.json({ error: "Nama, email dan password harus diisi" }, { status: 400 });
        }

        // Cek apakah email sudah terdaftar di database
        const existingUser = await db.select().from(user).where(eq(user.email, trimmedEmail)).limit(1);
        if (existingUser.length > 0) {
            logger.warn("Auth Warning: Email already registered", { email: trimmedEmail });
            return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
        }

        // Hash password menggunakan PHP untuk kompatibilitas 100% dengan Yii2 (BCRYPT cost 13)
        const b64Password = Buffer.from(password).toString('base64');
        const phpCmd = `php -r 'echo password_hash(base64_decode("${b64Password}"), PASSWORD_BCRYPT, ["cost" => 13]);'`;

        let passwordHash = "";
        try {
            passwordHash = execSync(phpCmd).toString().trim();
        } catch (e: any) {
            logger.error("Auth Error: PHP hash failure", { error: e.message, email: trimmedEmail });
            return NextResponse.json({ error: "Gagal memproses password" }, { status: 500 });
        }

        if (!passwordHash || !passwordHash.startsWith("$2")) {
            logger.error("Auth Error: Invalid hash generated", { email: trimmedEmail });
            return NextResponse.json({ error: "Internal Server Error (Hash)" }, { status: 500 });
        }

        const authKey = randomBytes(16).toString("hex");
        const now = Math.floor(Date.now() / 1000);

        // Menyimpan data user baru ke database
        await db.insert(user).values({
            username: trimmedEmail, // Menggunakan email sebagai username sementara
            email: trimmedEmail,
            passwordHash: passwordHash,
            authKey: authKey,
            nama: trimmedNama,
            role: 2, // Role default: Customer
            status: 10, // Status Active (konvensi Yii2)
            isDeleted: 2, // 2 artinya belum aktif/terverifikasi
            createdAt: now,
            updatedAt: now,
            alamat: "",
            photo: "",
            urlphoto: "",
            updatephoto: "",
        });

        logger.info("Auth Success: User registered successfully", { email: trimmedEmail });
        return NextResponse.json({ message: "Registrasi berhasil" }, { status: 201 });

    } catch (error: any) {
        logger.error("API Error: /api/auth/register", { error: error.message });
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}

