export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 4;
export const APP_NAME = process.env.APP_NAME ?? "BookStore";
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
  "A modern ecommerce platform - bookstore";
export const SERVER_URL = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SERVER_URL ??
  "http://localhost:3001"
).replace(/\/$/, "");
export const SENDER_EMAIL = process.env.SENDER_EMAIL ?? "";
export const ADMIN_EMAIL_1 = process.env.ADMIN_EMAIL_1 ?? "";
export const ADMIN_EMAIL_2 = process.env.ADMIN_EMAIL_2 ?? "";

export const reviewFormDefaultValues = {
  title: "",
  description: "",
  rating: 0,
};
