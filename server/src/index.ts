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
import { JobsService } from "./services/jobs.service.js";

import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";

const app: Express = express();
const port = environment.PORT || 8080;
const adminPort = environment.ADMIN_PORT || 8081;

const initialize = async () => {
    try {
        await AppDataSource.initialize();
        logger.info("🗲 [Database]: Database connection established successfully");

        await JobsService.initialize();
        logger.info("🗲 [JobsService]: Job service initialized successfully");

        // initialize Bull Board
        const serverAdapter = new ExpressAdapter();
        const adminApp = express();

        createBullBoard({
            queues: [
                new BullAdapter(JobsService.getTranscriptionQueue())
            ],
            serverAdapter,
        });

        adminApp.use(cors());
        serverAdapter.setBasePath("/admin/queues");
        adminApp.use("/admin/queues", serverAdapter.getRouter());

        // start admin server
        adminApp.listen(adminPort, () => {
            logger.info(`🗲 [Admin Server]: Admin server is running on port ${adminPort}`);
        });

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