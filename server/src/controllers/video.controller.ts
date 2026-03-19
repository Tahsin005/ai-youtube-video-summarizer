import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes/build/cjs/status-codes.js";
import { successResponse } from "../utils/response.js";
import logger from "../utils/logger.js";
import { VideoService } from "../services/video.service.js";

export class VideoController {
    static async getVideoInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const { url } = req.query;
            const videoInfo = await VideoService.getVideoInfo(url as string);
            res.status(StatusCodes.OK).json(successResponse(videoInfo));
        } catch (error) {
            logger.error("Error in getVideoInfo controller:", error);
            next(error);
        }
    }
};