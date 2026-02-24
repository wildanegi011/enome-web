import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth-utils";
import logger from "@/lib/logger";

/**
 * Handler untuk proses logout user.
 * Menghapus sesi atau token yang tersimpan.
 */
export async function POST(request: NextRequest) {
    logger.info("API Request: POST /api/auth/logout");
    try {
        await logout();
        logger.info("Auth Success: User logged out");
        return NextResponse.json({ message: "Logout berhasil" });
    } catch (error: any) {
        logger.error("API Error: /api/auth/logout", { error: error.message });
        return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
    }
}

