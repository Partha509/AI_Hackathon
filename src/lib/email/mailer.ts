import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP-backed email sender. Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * (e.g. Gmail: host smtp.gmail.com, port 465, user = address, pass = app password)
 */

let cachedTransport: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

/** Basic RFC-ish email format check to avoid sending to malformed addresses. */
export function isValidEmail(email: string): boolean {
  const value = email.trim();
  if (value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT ?? 587);

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    // Port 465 uses implicit TLS; other ports upgrade via STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  return cachedTransport;
}

function fromAddress(): string {
  return (
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "FacultyOS <no-reply@facultyos.edu>"
  );
}

export interface InviteEmailInput {
  to: string;
  fullName: string;
  role: "faculty" | "student" | "admin" | string;
  verifyUrl: string;
}

export interface SendResult {
  sent: boolean;
  error?: string;
}

/**
 * Sends the account verification / password-setup email.
 * Returns { sent: false } (never throws) so account creation is not blocked
 * if email delivery fails.
 */
export async function sendInviteEmail(
  input: InviteEmailInput
): Promise<SendResult> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "SMTP is not configured" };
  }

  const roleLabel =
    input.role === "faculty"
      ? "Faculty"
      : input.role === "student"
        ? "Student"
        : "FacultyOS";

  const subject = "Verify your FacultyOS account & set your password";

  const html = `
  <div style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0f172a;padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;">FacultyOS</span>
                <span style="color:#94a3b8;font-size:12px;margin-left:8px;">AUST CSE</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Welcome, ${escapeHtml(input.fullName)}</h1>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
                  An administrator has created a <strong>${roleLabel}</strong> account for you on FacultyOS.
                  To activate your account, verify your email and set a password by clicking the button below.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="border-radius:8px;background:#2563eb;">
                      <a href="${input.verifyUrl}" target="_blank"
                        style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                        Verify &amp; set password
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#94a3b8;">
                  This link is single-use and expires soon. If the button doesn't work, copy and paste this URL into your browser:
                </p>
                <p style="margin:0;font-size:12px;word-break:break-all;color:#2563eb;">${input.verifyUrl}</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
                <p style="margin:0;font-size:12px;color:#94a3b8;">
                  If you weren't expecting this invitation, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  const text = `Welcome, ${input.fullName}

An administrator has created a ${roleLabel} account for you on FacultyOS.
Verify your email and set your password here:

${input.verifyUrl}

This link is single-use and expires soon. If you weren't expecting this, ignore this email.`;

  try {
    await getTransport().sendMail({
      from: fromAddress(),
      to: input.to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
