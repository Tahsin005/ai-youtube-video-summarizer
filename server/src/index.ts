import dotenv from "dotenv";
dotenv.config({
    path: ".env",
});
import express, { type Express } from "express";

const app: Express = express();
const port = process.env.PORT || 6000;

const initialize = async () => {
    try {
        app.listen(port, () => {
            console.log(`🗲 [Server]: Server is running on port ${port}`);
            console.log(`🗲 [Server]: Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error(`✘ [Server]: Error occurred while initializing server: ${error}`);
        process.exit(1);
    }
};

initialize().catch((error) => {
    console.error(`✘ [Server]: Unhandled error during server initialization: ${error}`);
    process.exit(1);
});