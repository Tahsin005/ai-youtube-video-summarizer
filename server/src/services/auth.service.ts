import { User } from "../entities/user.entity.js";
import { AppDataSource } from "../config/database.js";
import { environment } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import {
    StatusCodes,
} from "http-status-codes";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import { EmailService } from "./email.service.js";
import logger from "../utils/logger.js";

export class AuthService {
    private static readonly userRepository = AppDataSource.getTreeRepository(User);
    private static readonly JWT_SECRET: string = environment.JWT_SECRET ?? "9b8092fa-5a33-4c36-b7fb-00fe8b286cc3";
    private static readonly JWT_EXPIRES_IN: string = environment.JWT_EXPIRES_IN ?? "24h";

    static async register(email: string, password: string, name?: string) {
        const exisitingUser = await this.userRepository.findOne({ 
            where: { email }
        });

        if (exisitingUser) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Email already in use");
        }

        // create verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 24); // token valid for 24 hours

        const user = new User();
        user.email = email;
        user.password = password;
        user.name = name || "";
        user.emailVerificationToken = verificationToken;
        user.emailVerificationTokenExpires = tokenExpires;

        await this.userRepository.save(user);

        await EmailService.sendVerificationEmail(user.email, verificationToken);
        
        const token = this.generateToken(user);
        return {
            user,
            token
        }
    }

    static async login(email: string, password: string) {
        const user = await this.userRepository.findOne({ 
            where: { email }
        });

        if (!user) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or password");
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or password");
        }

        if (!user.isEmailVerified) {
            throw new AppError(StatusCodes.FORBIDDEN, "Email not verified");
        }

        user.lastLogin = new Date();
        await this.userRepository.save(user);

        const token = this.generateToken(user);
        return {
            user,
            token
        }
    }

    static async verifyEmail(token: string) {
        logger.info(`Verifying email with token: ${token}`);
        const user = await this.userRepository.findOne({
            where: { emailVerificationToken: token }
        });

        if (!user) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Invalid verification token");
        }

        if (!user.emailVerificationTokenExpires || user.emailVerificationTokenExpires < new Date()) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Verification token has expired");
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationTokenExpires = null;

        await this.userRepository.save(user);

        await EmailService.sendWelcomeEmail(user.email, user.name);

        return {
            message: "Email verified successfully"
        }
    }

    static async resendVerificationEmail(email: string) {
        const user = await this.userRepository.findOne({
            where: { email }
        });

        if (!user) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Email not found");
        }

        if (user.isEmailVerified) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Email already verified");
        }

        // create new verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 24); // token valid for 24 hours

        user.emailVerificationToken = verificationToken;
        user.emailVerificationTokenExpires = tokenExpires;

        await this.userRepository.save(user);

        await EmailService.sendVerificationEmail(user.email, verificationToken);

        return {
            message: "Verification email resent successfully"
        }
    }

    static generateToken(user: User) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            this.JWT_SECRET as jwt.Secret,
            {
                expiresIn: this.JWT_EXPIRES_IN as SignOptions["expiresIn"],
            } as SignOptions
        );
    }

    static verifyToken(token: string) {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET as Secret) as { userId: string; email: string };
            return decoded;
        } catch (error) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid token");
        }
    }
}