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

        // TODO: send verification email
        
        const token = this.generateToken(user);
        return {
            user,
            token
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
}