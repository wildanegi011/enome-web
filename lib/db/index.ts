import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const poolConfig: mysql.PoolOptions = {
    uri: process.env.DATABASE_URL!,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// Apply SSL configuration if enabled
if (process.env.DB_SSL === "true") {
    poolConfig.ssl = {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
    };
}

const connection = mysql.createPool(poolConfig);

export const db = drizzle(connection, { schema, mode: "default" });
