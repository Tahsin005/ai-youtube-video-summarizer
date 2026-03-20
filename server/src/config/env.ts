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
    RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    API_URL: process.env.API_URL || "http://localhost:8080/api/v1",
    YOUTUBE_DL_PATH: process.env.YOUTUBE_DL_PATH || "/usr/bin/yt-dlp",
    SPEECH_TO_TEXT_LANGUAGE: process.env.SPEECH_TO_TEXT_LANGUAGE || "en-US",
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
};