import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();

  if (!t) {
    // In development, print the email so links can be copied from the terminal.
    // In production an unconfigured mailer is an error, so tokens never reach logs.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (SMTP_HOST is missing)");
    }
    console.log(
      `\n[email not configured, printing instead]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`,
    );
    return;
  }

  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}
