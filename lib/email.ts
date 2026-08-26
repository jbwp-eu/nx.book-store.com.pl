import nodemailer from "nodemailer";
import {
  ADMIN_EMAIL_1,
  ADMIN_EMAIL_2,
  APP_NAME,
  SENDER_EMAIL,
  SERVER_URL,
} from "@/lib/constants";
import type { Locale } from "@/lib/i18n";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password || !SENDER_EMAIL) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass: password,
    },
  });
}

export async function sendEmailMessage({
  email,
  message,
}: {
  email: string;
  message: string;
}) {
  const transporter = getTransporter();
  if (!transporter || !ADMIN_EMAIL_1) {
    throw new Error("SMTP is not configured");
  }

  return transporter.sendMail({
    from: `"${APP_NAME} Client 👻" <${SENDER_EMAIL}>`,
    to: [ADMIN_EMAIL_1, ADMIN_EMAIL_2].filter(Boolean).join(", "),
    replyTo: email,
    subject: `Message from ${email}`,
    text: `From: ${email}\n\n${message}`,
  });
}

export async function sendPasswordResetEmail({
  to,
  token,
  lang,
}: {
  to: string;
  token: string;
  lang: Locale;
}) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("SMTP is not configured");
  }

  const resetUrl = `${SERVER_URL}/${lang}/reset-password?token=${encodeURIComponent(token)}`;
  const subject =
    lang === "en" ? `${APP_NAME} — Reset password` : `${APP_NAME} — Reset hasła`;
  const text =
    lang === "en"
      ? `Reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request it, ignore this email.`
      : `Zresetuj hasło:\n\n${resetUrl}\n\nLink wygasa po godzinie. Jeśli nie prosiłeś o reset, zignoruj tę wiadomość.`;

  return transporter.sendMail({
    from: `"${APP_NAME}" <${SENDER_EMAIL}>`,
    to,
    subject,
    text,
  });
}

export async function sendOrderStatusEmail({
  to,
  orderId,
  status,
  lang,
  totalPrice,
}: {
  to: string;
  orderId: string;
  status: "paid" | "delivered";
  lang: Locale;
  totalPrice: string;
}) {
  const transporter = getTransporter();
  if (!transporter) return null;

  const orderUrl = `${SERVER_URL}/${lang}/order/${orderId}`;
  const disclaimer =
    lang === "en"
      ? "IMPORTANT: This is not a real order confirmation. The bookstore is a demo app for testing only — no real payments or shipments are processed."
      : "WAŻNE: To nie jest prawdziwe potwierdzenie zamówienia. Księgarnia to aplikacja demonstracyjna wyłącznie do testów — nie są realizowane prawdziwe płatności ani wysyłki.";

  const subject =
    status === "paid"
      ? lang === "en"
        ? `${APP_NAME} — Payment received (demo)`
        : `${APP_NAME} — Otrzymaliśmy płatność (demo)`
      : lang === "en"
        ? `${APP_NAME} — Order delivered (demo)`
        : `${APP_NAME} — Zamówienie dostarczone (demo)`;

  const body =
    status === "paid"
      ? lang === "en"
        ? `Your order ${orderId} has been paid (${totalPrice} PLN).\n\nDetails: ${orderUrl}`
        : `Twoje zamówienie ${orderId} zostało opłacone (${totalPrice} PLN).\n\nSzczegóły: ${orderUrl}`
      : lang === "en"
        ? `Your order ${orderId} has been marked as delivered.\n\nDetails: ${orderUrl}`
        : `Twoje zamówienie ${orderId} zostało oznaczone jako dostarczone.\n\nSzczegóły: ${orderUrl}`;

  const text = `${disclaimer}\n\n${body}`;

  try {
    return await transporter.sendMail({
      from: `"${APP_NAME}" <${SENDER_EMAIL}>`,
      to,
      subject,
      text,
    });
  } catch {
    return null;
  }
}
