import { redirect } from "next/navigation";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

type Params = Promise<{ lang: string }>;

export default async function AdminIndexPage({ params }: { params: Params }) {
  const { lang } = await params;
  const language: Locale = locales.includes(lang as Locale)
    ? (lang as Locale)
    : defaultLocale;
  redirect(`/${language}/admin/overview`);
}
