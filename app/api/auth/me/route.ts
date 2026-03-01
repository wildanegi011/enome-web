import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-utils";
import logger, { apiLogger } from "@/lib/logger";

/**
 * Mengecek status autentikasi user saat ini.
 * Digunakan frontend (useAuth hook) untuk verifikasi session.
 *
 * @auth required
 * @method GET
 * @response 200 (authenticated)   — { authenticated: true, user: { id, email, name } }
 * @response 401 (unauthenticated) — { message: string, authenticated: false }
 */
export const GET = withAuth(async (request: NextRequest, context: any, session: any) => {
    logger.debug("API Request: GET /api/auth/me");
    try {
        logger.debug("Auth Check: Success /api/auth/me", { userId: session.user.id });
        return NextResponse.json({
            authenticated: true,
            user: session.user
        });
    } catch (error: any) {
        apiLogger.error(request, error);
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
});

