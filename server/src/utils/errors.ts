import logger from "./logger.js";

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational: boolean = true,
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
};

export const handleError = (err: Error | AppError) => {
    if (err instanceof AppError && err.isOperational) {
        return {
            status: "error",
            statusCode: err.statusCode,
            message: err.message,
        };
    }

    // for unexpected errors, log the error and return a generic message
    logger.error("Unexpected error:", err);
    return {
        status: "error",
        statusCode: 500,
        message: "Internal Server Error",
    };
};