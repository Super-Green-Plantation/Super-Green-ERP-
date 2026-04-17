import nodemailer from "nodemailer";

// Create transporter from environment SMTP config
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: process.env.EMAIL_PORT === "465", // true only for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendWelcomeEmailOptions {
  to: string;
  name: string | undefined;
  empNo: string;
  tempPassword: string;
}

export async function sendWelcomeEmail({
  to,
  name,
  empNo,
  tempPassword,
}: SendWelcomeEmailOptions) {
  const appUrl = process.env.APP_URL;

  await transporter.sendMail({
    from: `"Super Green" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Welcome to Super Green — Your Account is Ready",
    // Attach the image so we can reference it via 'cid'
    attachments: [{
      filename: 'logo.png',
      path: './public/logo.png', // Path to your file
      cid: 'supergreen-logo' // Same identifier used in the <img> tag
    }],
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Super Green</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 10px;">
              <div style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                
                <div style="background-color: #064e3b; padding: 32px; text-align: center;">
                  <img src="cid:supergreen-logo" alt="Super Green Logo" style="height: 60px; width: auto; margin-bottom: 12px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Super Green ERP</h1>
                  <p style="color: #6ee7b7; margin: 4px 0 0; font-size: 14px; text-transform: uppercase;">Employee Management Portal</p>
                </div>

                <div style="padding: 40px 32px;">
                  <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 20px; font-weight: 700;">Hello ${name},</h2>
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                    Welcome to the team! Your employee account has been successfully provisioned. You can now access the ERP portal using the secure credentials provided below.
                  </p>

                  <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 12px; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Employee ID</td>
                        <td style="padding-bottom: 12px; color: #0f172a; font-size: 15px; font-weight: 700; text-align: right;">${empNo}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Login Email</td>
                        <td style="padding-bottom: 12px; color: #0f172a; font-size: 15px; font-weight: 600; text-align: right;">${to}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Temporary Password</td>
                        <td style="text-align: right;">
                          <span style="background-color: #fef08a; color: #854d0e; padding: 6px 12px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: 700; border: 1px solid #facc15;">
                            ${tempPassword}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <div style="text-align: center;">
                    <a href="${appUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);">
                      Access Your Account
                    </a>
                    <p style="color: #ef4444; font-size: 13px; margin-top: 20px; font-weight: 600;">
                      * You will be required to change this password upon your first login.
                    </p>
                  </div>
                </div>

                <div style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                    This is an automated system message from <strong>Super Green ERP</strong>.<br>
                    Please do not reply to this email. For support, contact your HR administrator.
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}


export function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";

  const rand = (str: string) => str[Math.floor(Math.random() * str.length)];

  const parts = [
    rand(upper), rand(upper), rand(upper),
    rand(lower), rand(lower), rand(lower),
    rand(digits), rand(digits), rand(digits),
  ];

  // Shuffle to avoid predictable pattern
  return parts.sort(() => Math.random() - 0.5).join("");
}
