import { auth } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { redirect } from "next/navigation";

export async function requireUser(lang: Locale, callbackPath: string) {
  const session = await auth();
  if (!session?.user?.id) {
    const path = callbackPath.startsWith("/")
      ? callbackPath
      : `/${callbackPath}`;
    const callbackUrl = path.startsWith(`/${lang}/`) || path === `/${lang}`
      ? path
      : `/${lang}${path}`;

    redirect(
      `/${lang}/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }
  return session;
}
