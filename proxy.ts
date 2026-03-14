import { NextRequest, NextResponse } from "next/server";
import { updateSession, getSession } from "@/lib/auth-utils";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Proteksi route /account
    if (pathname.startsWith("/account")) {
        const session = await getSession();
        if (!session) {
            const loginUrl = new URL("/login", request.url);

            // Gunakan request.url asli untuk mendapatkan path + search mentah yang belum ter-decode
            // Ini untuk menjamin PO%23 tetap menjadi PO%23 dan tidak berubah menjadi PO#
            const origin = request.nextUrl.origin;
            let fullPath = request.url.replace(origin, "");

            // CRITICAL: Jika karakter '#' muncul (mungkin sudah ter-decode oleh server/middleware sebelumnya),
            // kita harus meng-encode-nya kembali menjadi '%23' agar tidak dianggap fragment
            // saat di-decode satu kali oleh searchParams.get() di halaman login.
            if (fullPath.includes("#")) {
                fullPath = fullPath.replace(/#/g, "%23");
            }

            loginUrl.searchParams.set("callbackUrl", fullPath);
            return NextResponse.redirect(loginUrl);
        }
    }

    return await updateSession(request);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
