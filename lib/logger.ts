import winston from "winston";
import path from "path";
import "winston-daily-rotate-file";
import { CONFIG } from "./config";
import { NextRequest } from "next/server";

// ============================================================
// FORMAT DEFINITIONS
// ============================================================

/** Format JSON terstruktur untuk file log (mudah di-parse oleh tools seperti jq) */
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

/** Format console yang lebih readable untuk development */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `[${timestamp}] ${level}: ${message}`;
        if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        if (metadata.stack) {
            msg += `\n${metadata.stack}`;
        }
        return msg;
    })
);

// ============================================================
// DAILY ROTATE FILE CONFIG
// ============================================================

const dailyRotateConfig = {
    datePattern: CONFIG.LOGS.DATE_PATTERN,
    zippedArchive: CONFIG.LOGS.ZIP_ARCHIVE,
    maxSize: CONFIG.LOGS.MAX_SIZE,
    maxFiles: CONFIG.LOGS.MAX_FILES,
};

// ============================================================
// LOGGER INSTANCE
// ============================================================

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    format: logFormat,
    defaultMeta: { service: CONFIG.SERVICE_NAME },
    transports: process.env.SKIP_LOG_FILES === "1" ? [] : [
        // Error logs → file terpisah untuk monitoring cepat
        new winston.transports.DailyRotateFile({
            ...dailyRotateConfig,
            filename: path.join(process.cwd(), "logs/error-%DATE%.log"),
            level: "error",
        }),
        // Combined logs → semua level untuk audit trail
        new winston.transports.DailyRotateFile({
            ...dailyRotateConfig,
            filename: path.join(process.cwd(), "logs/combined-%DATE%.log"),
        }),
    ],
});

// Console output hanya di non-production
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
}

// ============================================================
// API LOGGER HELPERS
// ============================================================

/** Daftar field sensitif yang akan di-mask di log */
const SENSITIVE_FIELDS = ["password", "token", "credential", "authKey", "passwordHash", "passwordResetToken", "verificationToken"];

/**
 * Menyembunyikan field sensitif dari object sebelum di-log.
 * Mencegah password, token, dll tampil di file log.
 *
 * @param obj - Object yang akan disanitize
 * @returns Object baru dengan field sensitif di-mask "***"
 */
function sanitizeBody(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
            sanitized[key] = "***";
        } else if (typeof value === "object" && value !== null) {
            sanitized[key] = sanitizeBody(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Mengekstrak informasi penting dari NextRequest untuk logging.
 * Otomatis mengambil method, pathname, query params, dan IP.
 *
 * @param request - NextRequest object dari API route handler
 * @returns Object berisi method, path, dan query string
 */
function extractRequestInfo(request: NextRequest) {
    const url = new URL(request.url);
    return {
        method: request.method,
        path: url.pathname,
        query: url.search || undefined,
    };
}

/**
 * Log incoming API request.
 * Digunakan di awal setiap API handler untuk mencatat request masuk.
 *
 * @param request - NextRequest object
 * @param context - Data tambahan (body, userId, dll) yang sudah di-sanitize otomatis
 *
 * @example
 * ```ts
 * apiLogger.request(request, { userId, body: { id_produk, qty } });
 * // Log: "→ POST /api/cart/add" { userId: 5, body: { id_produk: "P001", qty: 2 } }
 * ```
 */
function apiRequest(request: NextRequest, context?: Record<string, any>) {
    const info = extractRequestInfo(request);
    const sanitizedCtx = context ? sanitizeBody(context) : undefined;
    logger.info(`→ ${info.method} ${info.path}`, {
        ...info,
        ...sanitizedCtx,
    });
}

/**
 * Log API error dan return pesan generik yang aman untuk frontend.
 * Full error details (message + stack trace) hanya masuk ke file log,
 * TIDAK pernah dikirim ke client/toast.
 *
 * @param request - NextRequest object (atau null jika tidak tersedia)
 * @param error - Error object dari catch block
 * @param context - Data tambahan untuk debugging (userId, productId, dll)
 * @returns String pesan generik yang aman ditampilkan ke user
 *
 * @example
 * ```ts
 * catch (error: any) {
 *     const message = apiLogger.error(request, error, { userId });
 *     return NextResponse.json({ error: message }, { status: 500 });
 * }
 * // Log: "✗ POST /api/cart/add" { error: "ECONNREFUSED...", stack: "...", userId: 5 }
 * // Frontend hanya terima: { error: "Terjadi kesalahan sistem" }
 * ```
 */
function apiError(request: NextRequest | null, error: any, context?: Record<string, any>): string {
    const info = request ? extractRequestInfo(request) : { method: "UNKNOWN", path: "UNKNOWN" };
    logger.error(`✗ ${info.method} ${info.path}`, {
        ...info,
        error: error?.message || String(error),
        stack: error?.stack,
        ...context,
    });
    return "Terjadi kesalahan sistem";
}

/**
 * Log API response sukses.
 * Digunakan sebelum mengembalikan response 200/201.
 *
 * @param request - NextRequest object
 * @param context - Data ringkasan response (count, total, userId, dll)
 *
 * @example
 * ```ts
 * apiLogger.success(request, { count: products.length });
 * // Log: "✓ GET /api/products" { count: 12 }
 * ```
 */
function apiSuccess(request: NextRequest, context?: Record<string, any>) {
    const info = extractRequestInfo(request);
    logger.info(`✓ ${info.method} ${info.path}`, {
        ...info,
        ...context,
    });
}

/**
 * Log API warning (validasi gagal, unauthorized, dll).
 * Untuk kasus yang bukan error sistem tapi perlu dicatat.
 *
 * @param request - NextRequest object
 * @param message - Pesan warning spesifik
 * @param context - Data tambahan
 */
function apiWarn(request: NextRequest, message: string, context?: Record<string, any>) {
    const info = extractRequestInfo(request);
    logger.warn(`⚠ ${info.method} ${info.path}: ${message}`, {
        ...info,
        ...context,
    });
}

/**
 * API Logger — kumpulan helper functions untuk logging API yang konsisten.
 *
 * Setiap helper otomatis mengekstrak method & path dari request,
 * sanitize field sensitif, dan menulis ke file log + console.
 *
 * **Penting**: `apiLogger.error()` mengembalikan pesan generik
 * yang aman untuk dikirim ke frontend. Detail error hanya masuk ke log file.
 */
export const apiLogger = {
    /** Log incoming request */
    request: apiRequest,
    /** Log error + return safe message untuk frontend */
    error: apiError,
    /** Log successful response */
    success: apiSuccess,
    /** Log warning (validasi gagal, unauthorized) */
    warn: apiWarn,
    /** Sanitize object dari field sensitif */
    sanitizeBody,
};

export default logger;
