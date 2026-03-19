import { Resend } from "resend";
import { environment } from "../config/env.js";
import { verificationEmailTemplate } from "../templates/emails/verification.template.js";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";

export class EmailService {
    private static readonly resend = new Resend(environment.RESEND_API_KEY);  
    private static readonly FROM_EMAIL = "onboarding@resend.dev";

    static async sendVerificationEmail(email: string, token: string) {
        try {
            const verificationUrl = `${environment.FRONTEND_URL}/api/v1/auth/verify-email?token=${token}`;

            await this.resend.emails.send({
                from: this.FROM_EMAIL,
                to: email,
                subject: "Verify your email",
                html: verificationEmailTemplate(verificationUrl)
            });
            logger.info(`Verification email sent to ${email}`);
        } catch (error) {
            logger.error("Error sending verification email:", error);
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send verification email");
        }
    }
}