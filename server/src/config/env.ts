import dotenv from "dotenv";

dotenv.config();

export const environment = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 6000,
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_PORT: process.env.DB_PORT || "5432",
    DB_USERNAME: process.env.DB_USERNAME || "postgres",
    DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
    DB_DATABASE: process.env.DB_DATABSE || "video_summarizer",
};