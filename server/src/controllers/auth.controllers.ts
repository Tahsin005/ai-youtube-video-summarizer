import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { successResponse } from "../utils/response.js";
import logger from "../utils/logger.js";
import { StatusCodes } from "http-status-codes";

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, name } = req.body;
            const result = await AuthService.register(email, password, name);
            res.status(StatusCodes.CREATED).json(successResponse(result));
        } catch (error) {
            logger.error("Error in register controller:", error);
            next(error);
        }
    }
};