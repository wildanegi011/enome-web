import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { user as userTable } from "./db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";

const secretKey = "secret";
const key = new TextEncoder().encode(process.env.JWT_SECRET || secretKey);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function login(user: any) {
    // Update last activity
    await db.update(userTable)
        .set({ lastActivity: sql`NOW()` })
        .where(eq(userTable.id, user.id));

    // Create the session
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await encrypt({ user, expires });

    // Save the session in a cookie
    const cookieStore = await cookies();
    cookieStore.set("session", session, { expires, httpOnly: true, secure: process.env.NODE_ENV === "production" });
}

export async function logout() {
    const session = await getSession();
    if (session?.user?.id) {
        // Set last activity to 10 minutes ago to immediately appear offline in admin
        await db.update(userTable)
            .set({ lastActivity: sql`DATE_SUB(NOW(), INTERVAL 10 MINUTE)` })
            .where(eq(userTable.id, session.user.id));
    }

    // Destroy the session
    const cookieStore = await cookies();
    cookieStore.set("session", "", { expires: new Date(0) });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch (error) {
        return null;
    }
}

export async function verifyUser(userId: number) {
    try {
        const currentUser = await db.query.user.findFirst({
            where: and(
                eq(userTable.id, userId),
                or(
                    eq(userTable.isDeleted, 0),
                    isNull(userTable.isDeleted)
                )
            )
        });
        return currentUser;
    } catch (error) {
        return null;
    }
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;

    // Refresh the session so it doesn't expire
    let parsed;
    try {
        parsed = await decrypt(session);
    } catch (e) {
        return;
    }

    // Verify user still exists and update last activity
    await db.update(userTable)
        .set({ lastActivity: sql`NOW()` })
        .where(eq(userTable.id, parsed.user.id));

    const validUser = await verifyUser(parsed.user.id);
    if (!validUser) {
        const res = NextResponse.next();
        res.cookies.set({
            name: "session",
            value: "",
            httpOnly: true,
            expires: new Date(0),
        });
        return res;
    }

    parsed.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
        name: "session",
        value: await encrypt(parsed),
        httpOnly: true,
        expires: parsed.expires,
        secure: process.env.NODE_ENV === "production"
    });
    return res;
}

type AuthenticatedHandler = (
    request: NextRequest,
    context: any,
    session: any
) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: AuthenticatedHandler) {
    return async (request: NextRequest, context: any) => {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ message: "Silakan login terlebih dahulu", authenticated: false }, { status: 401 });
        }
        return handler(request, context, session);
    };
}

export function withOptionalAuth(handler: AuthenticatedHandler) {
    return async (request: NextRequest, context: any) => {
        const session = await getSession();
        return handler(request, context, session);
    };
}
