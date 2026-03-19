import { baseEmailTemplate } from "./base.template.js";

export const verificationEmailTemplate = (verificationUrl: string): string => {
    return baseEmailTemplate({
        title: "Verify Your Email",
        body: `
            <p>Welcome! 👋</p>
            <p>Thanks for signing up. Please confirm your email address by clicking the button below.</p>
            <p>If you didn’t create this account, you can safely ignore this email.</p>
        `,
        buttonText: "Verify Email",
        buttonUrl: verificationUrl,
    });
};