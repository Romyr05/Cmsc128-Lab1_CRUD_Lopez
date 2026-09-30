import nodemailer from "nodemailer";

// SMTP transport (Gmail). Values come from .env — never hardcode credentials.
// Port 587 uses STARTTLS, so `secure` is false (nodemailer upgrades the
// connection to TLS automatically); `secure: true` is only for port 465.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send the password-reset email. If SMTP isn't configured yet (no app
// password), fall back to logging the link so the flow is testable in dev.
export async function sendResetEmail(to: string, link: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[mailer] SMTP not configured — reset link for ${to}:\n${link}`);
    return;
  }

  await transporter.sendMail({
    from: `"Todo App" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset your password",
    html: `<p>Click to reset your password:</p>
           <p><a href="${link}">${link}</a></p>
           <p>This link expires in 1 hour. If you didn't request this, ignore it.</p>`,
  });
}
