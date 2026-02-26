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
  name: string;
  empNo: string;
  tempPassword: string;
}

export async function sendWelcomeEmail({
  to,
  name,
  empNo,
  tempPassword,
}: SendWelcomeEmailOptions) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await transporter.sendMail({
    from: `"Super Green" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Welcome to Super Green — Your Account Details",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f7f6; padding: 32px;">
          <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background: #1a1a2e; padding: 28px 32px;">
              <h1 style="color: #4ade80; margin: 0; font-size: 22px;">🌿 Super Green ERP</h1>
              <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Employee Management System</p>
            </div>
            <!-- Body -->
            <div style="padding: 32px;">
              <h2 style="color: #1e293b; margin: 0 0 8px;">Welcome, ${name}!</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Your employee account has been created. Use the credentials below to log in for the first time.
                <strong>Please change your password immediately after logging in.</strong>
              </p>

              <!-- Credentials Box -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="color: #64748b; padding: 6px 0; width: 130px;">Employee ID</td>
                    <td style="color: #1e293b; font-weight: 600;">${empNo}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 6px 0;">Email</td>
                    <td style="color: #1e293b; font-weight: 600;">${to}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 6px 0;">Temp Password</td>
                    <td>
                      <code style="background: #fef9c3; color: #854d0e; padding: 4px 10px; border-radius: 6px; font-size: 15px; font-weight: bold; letter-spacing: 1px;">
                        ${tempPassword}
                      </code>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <a href="${appUrl}" style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                Log In Now →
              </a>

              <p style="color: #94a3b8; font-size: 12px; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                This is an automated message from Super Green ERP. Do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Generates a random temporary password.
 * Format: 3 uppercase + 3 lowercase + 3 digits + 2 symbol chars = 11 chars
 */
export function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";

  const rand = (str: string) => str[Math.floor(Math.random() * str.length)];

  const parts = [
    rand(upper), rand(upper), rand(upper),
    rand(lower), rand(lower), rand(lower),
    rand(digits), rand(digits), rand(digits),
    rand(symbols), rand(symbols),
  ];

  // Shuffle to avoid predictable pattern
  return parts.sort(() => Math.random() - 0.5).join("");
}
