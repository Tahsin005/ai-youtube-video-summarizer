export interface EmailTemplateContent {
    title: string;
    body: string;
    buttonText?: string;
    buttonUrl?: string;
}

export const baseEmailTemplate = (content: EmailTemplateContent): string => {
    const buttonSection =
        content.buttonText && content.buttonUrl
            ? `
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <a href="${content.buttonUrl}" 
                       style="
                            background-color: #4F46E5;
                            color: #ffffff;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 6px;
                            font-size: 14px;
                            font-weight: 600;
                            display: inline-block;
                       ">
                        ${content.buttonText}
                    </a>
                </td>
            </tr>

            <tr>
                <td align="center" style="padding-top: 10px;">
                    <p style="font-size: 12px; color: #888;">
                        Or copy and paste this link into your browser:
                    </p>
                    <a href="${content.buttonUrl}" style="font-size: 12px; color: #4F46E5;">
                        ${content.buttonUrl}
                    </a>
                </td>
            </tr>
        `
            : "";

    return `
    <html>
        <body style="margin:0; padding:0; background-color:#f3f4f6; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" max-width="500px" cellpadding="0" cellspacing="0" 
                               style="background:#ffffff; border-radius:10px; padding:30px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                            
                            <!-- Title -->
                            <tr>
                                <td align="center">
                                    <h1 style="margin:0; font-size:22px; color:#111;">
                                        ${content.title}
                                    </h1>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding-top:20px; font-size:14px; color:#444; line-height:1.6;">
                                    ${content.body}
                                </td>
                            </tr>

                            ${buttonSection}

                            <!-- Footer -->
                            <tr>
                                <td align="center" style="padding-top:30px;">
                                    <p style="font-size:11px; color:#aaa;">
                                        © ${new Date().getFullYear()} Video Summarizer. All rights reserved.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
    `;
};