import express, { type Express } from "express";
import { environment } from "./config/env.js";
import logger from "./utils/logger.js";
import { AppDataSource } from "./config/database.js";

const app: Express = express();
const port = environment.PORT || 6000;

const initialize = async () => {
    try {
        await AppDataSource.initialize();
        logger.info("🗲 [Database]: Database connection established successfully");

        app.listen(port, () => {
            logger.info(`🗲 [Server]: Server is running on port ${port}`);
            logger.info(`🗲 [Server]: Environment: ${environment.NODE_ENV}`);
        });
    } catch (error) {
        logger.error(`✘ [Server]: Error occurred while initializing server: ${error}`);
        process.exit(1);
    }
};

initialize().catch((error) => {
    logger.error(`✘ [Server]: Unhandled error during server initialization: ${error}`);
    process.exit(1);
});