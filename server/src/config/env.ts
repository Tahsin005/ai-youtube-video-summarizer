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
    JWT_SECRET: process.env.JWT_SECRET || "9b8092fa-5a33-4c36-b7fb-00fe8b286cc3",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
};