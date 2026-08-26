import { auth } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { redirect } from "next/navigation";

export async function requireAdmin(lang: Locale) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/${lang}/sign-in?callbackUrl=${encodeURIComponent(`/${lang}/admin/overview`)}`,
    );
  }
  if (session.user.role !== "admin") {
    redirect(`/${lang}/unauthorized`);
  }
  return session;
}
