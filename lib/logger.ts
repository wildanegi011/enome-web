import winston from "winston";
import path from "path";
import "winston-daily-rotate-file";
import { CONFIG } from "./config";

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Custom format for console (more readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `[${timestamp}] ${level}: ${message}`;
        if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

// Configuration for Rotate File
const dailyRotateConfig = {
    datePattern: CONFIG.LOGS.DATE_PATTERN,
    zippedArchive: CONFIG.LOGS.ZIP_ARCHIVE,
    maxSize: CONFIG.LOGS.MAX_SIZE,
    maxFiles: CONFIG.LOGS.MAX_FILES,
};

// Initialize Logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    format: logFormat,
    defaultMeta: { service: CONFIG.SERVICE_NAME },
    transports: [
        // Error logs rotation
        new winston.transports.DailyRotateFile({
            ...dailyRotateConfig,
            filename: path.join(process.cwd(), "logs/error-%DATE%.log"),
            level: "error",
        }),
        // Combined logs rotation
        new winston.transports.DailyRotateFile({
            ...dailyRotateConfig,
            filename: path.join(process.cwd(), "logs/combined-%DATE%.log"),
        }),
    ],
});

// If we're not in production then log to the `console`
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
}

export default logger;


