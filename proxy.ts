import { NextRequest, NextResponse } from "next/server";
import { updateSession, getSession } from "@/lib/auth-utils";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Proteksi route /account
    if (pathname.startsWith("/account")) {
        const session = await getSession();
        if (!session) {
            const loginUrl = new URL("/login", request.url);
            // Simpan path asal agar bisa kembali setelah login (opsional tapi bagus)
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return await updateSession(request);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
