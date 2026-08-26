"use server";

import { headers } from "next/headers";
import { sendEmailMessage } from "@/lib/email";
import type { Locale } from "@/lib/i18n";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import {
  firstZodMessage,
  insertEmailMessageSchema,
  type InsertEmailMessage,
} from "@/lib/validators";

export async function sendMessageAction(
  lang: Locale,
  values: InsertEmailMessage,
) {
  const parsed = insertEmailMessageSchema(lang).safeParse(values);
  if (!parsed.success) {
    return {
      success: false as const,
      message: firstZodMessage(parsed.error, lang),
    };
  }

  const headerList = await headers();
  const limited = rateLimit({
    key: clientKeyFromHeaders(
      headerList,
      `contact-email:${parsed.data.email.toLowerCase()}`,
    ),
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return {
      success: false as const,
      message:
        lang === "en"
          ? "Too many messages. Try again later."
          : "Zbyt wiele wiadomości. Spróbuj ponownie później.",
    };
  }

  try {
    const res = await sendEmailMessage(parsed.data);
    if (res?.messageId) {
      return {
        success: true as const,
        message:
          lang === "en"
            ? "Email sent successfully"
            : "Wiadomość została wysłana",
      };
    }
    return {
      success: false as const,
      message:
        lang === "en" ? "Email was not sent" : "Wiadomość nie została wysłana",
    };
  } catch {
    return {
      success: false as const,
      message:
        lang === "en" ? "Email was not sent" : "Wiadomość nie została wysłana",
    };
  }
}
