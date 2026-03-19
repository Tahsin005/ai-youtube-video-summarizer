import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes/build/cjs/status-codes.js";
import { AppError } from "../utils/errors.js";
import validator from "validator";

export const validateUrl = (req: Request, res: Response, next: NextFunction) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
        return next(new AppError(StatusCodes.BAD_REQUEST, "URL is required and must be a string"));
    }
    
    if (!validator.isURL(url, { protocols: ["http", "https"], require_protocol: true })) {
        return next(new AppError(StatusCodes.BAD_REQUEST, "Invalid URL format"));
    }

    // check if the URL is a YouTube video URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(url)) {
        return next(new AppError(StatusCodes.BAD_REQUEST, "URL must be a valid YouTube video URL"));
    }

    next();
}