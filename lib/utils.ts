import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("pl-PL", {
  currency: "PLN",
  style: "currency",
  minimumFractionDigits: 2,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("pl-PL");

export function formatCurrency(amount: number | string | null) {
  if (amount === null) return "";
  const value = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(value)) return "";
  return CURRENCY_FORMATTER.format(value);
}

export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number);
}

export function formatDateTime(date: Date) {
  return {
    dateTime: date.toLocaleString("pl-PL", {
      month: "short",
      year: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }),
    dateOnly: date.toLocaleDateString("pl-PL", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}
