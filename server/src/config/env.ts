import dotenv from "dotenv";

dotenv.config();

export const environment = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 6000,
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
};