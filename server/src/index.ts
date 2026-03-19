import "reflect-metadata";
import express, { type Express } from "express";
import type { NextFunction, Request, Response } from "express";
import { environment } from "./config/env.js";
import logger, { stream } from "./utils/logger.js";
import { AppDataSource } from "./config/database.js";
import routes from "./routes/index.js";

import cors from "cors";
import morgan from "morgan";
import { errorResponse } from "./utils/response.js";
import { handleError } from "./utils/errors.js";

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

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan(environment.NODE_ENV === "development" ? "dev" : "combined", { stream }));

// api versioning
const API_VERSION = "/api/v1";

app.use(API_VERSION, routes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json(errorResponse(`✘ [Server]: Route not found: ${req.method} ${req.originalUrl}`));
});

// global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack || err.message || "Unknown error");
    const errorResponseData = handleError(err);
    res.status(errorResponseData.statusCode).json(errorResponseData);
});


initialize().catch((error) => {
    logger.error(`✘ [Server]: Unhandled error during server initialization: ${error}`);
    process.exit(1);
});