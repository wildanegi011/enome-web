import { db } from "@/lib/db";
import { newsLatter } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { message: "Email harus diisi" },
                { status: 400 }
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Format email tidak valid" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existing = await db.query.newsLatter.findFirst({
            where: eq(newsLatter.email, email),
        });

        if (existing) {
            return NextResponse.json(
                { message: "Email ini sudah terdaftar dalam newsletter kami" },
                { status: 409 }
            );
        }

        // Insert into database
        await db.insert(newsLatter).values({
            email,
        });

        return NextResponse.json(
            { message: "Selamat bergabung! Anda akan segera menerima info eksklusif dan penawaran spesial dari ÉNOMÉ langsung di inbox Anda." },
            { status: 201 }
        );
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return NextResponse.json(
            { message: "Terjadi kesalahan pada server" },
            { status: 500 }
        );
    }
}
