import { baseEmailTemplate } from "./base.template.js";

export const welcomeEmailTemplate = (name?: string): string => {
    return baseEmailTemplate({
        title: "Welcome to Video Summarizer!",
        body: `
            <p>We're excited to have you on board!</p>

            <p>
                Your account has been successfully created, and you're now ready to explore everything we have to offer.
            </p>

            <p>
                Here are a few things you can do next:
            </p>

            <ul style="padding-left: 20px; margin: 10px 0;">
                <li>✅ Set up your profile</li>
                <li>🚀 Start using the platform</li>
                <li>🔐 Explore features and settings</li>
            </ul>

            <p>
                If you ever need help, feel free to reach out — we're always here for you.
            </p>

            <p style="margin-top: 20px;">
                Cheers,<br/>
                <strong>The Team</strong>
            </p>
        `,
        buttonText: "Start Trascribing Videos",
        buttonUrl: `http://localhost:3000/dashboard`,
    });
};