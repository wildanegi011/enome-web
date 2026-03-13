import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * Optimized Database Connection Pool
 * Uses a singleton pattern to prevent pool exhaustion in Next.js development mode (hot reloads).
 * Includes keep-alive and connection limit optimizations.
 */

const poolConfig: mysql.PoolOptions = {
    uri: process.env.DATABASE_URL!,
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10,
    maxIdle: 10, // Max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // Idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
};

// Apply SSL configuration if enabled
if (process.env.DB_SSL === "true") {
    poolConfig.ssl = {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
    };
}

// Singleton pattern for the connection pool
const globalForDb = globalThis as unknown as {
    conn: mysql.Pool | undefined;
};

const connection = globalForDb.conn ?? mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== "production") globalForDb.conn = connection;

export const db = drizzle(connection, { schema, mode: "default" });
