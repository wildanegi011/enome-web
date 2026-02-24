import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import logger from "@/lib/logger";

/**
 * Handler untuk mendapatkan data sesi user yang sedang login.
 * Digunakan oleh frontend untuk memverifikasi status autentikasi.
 */
export async function GET(request: NextRequest) {
    logger.debug("API Request: GET /api/auth/me");
    try {
        const session = await getSession();

        if (!session) {
            logger.info("Auth Check: Unauthorized /api/auth/me");
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        logger.debug("Auth Check: Success /api/auth/me", { userId: session.user.id });
        return NextResponse.json({
            authenticated: true,
            user: session.user
        });

    } catch (error: any) {
        logger.error("API Error: /api/auth/me", { error: error.message });
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}

