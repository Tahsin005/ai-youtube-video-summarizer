import path from "node:path";
import fs, { write } from "node:fs";
import winston from "winston";
import { environment } from "../config/env.js";

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
};

winston.addColors(colors);

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
        return `${timestamp} [${level}]: ${message} ${metaString}`;
    })
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.json()
);

const level = () => {
    const env = environment.NODE_ENV || "development";
    const isDevelopment = env === "development";
    return isDevelopment ? "debug" : "info";
};

const logDir = "logs";
const errorLog = path.join(logDir, "error.log");
const combinedLog = path.join(logDir, "combined.log");

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
    level: level(),
    levels,
    format: fileFormat,
    transports: [
        // write all logs with level `error` and below to `error.log`
        new winston.transports.File({ filename: errorLog, level: "error" }),
        new winston.transports.File({ filename: combinedLog }),
    ],
});

if (environment.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
}

export const stream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

export default logger;