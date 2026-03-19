import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
        }
    }
}

export const authenticate = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = AuthService.verifyToken(token as string);
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};