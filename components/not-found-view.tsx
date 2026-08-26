import Link from "next/link";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function NotFoundView({ lang }: { lang?: string }) {
  const language: Locale = locales.includes(lang as Locale)
    ? (lang as Locale)
    : defaultLocale;
  const t = (await getDictionary(language)).not_found;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
        {t.description}
      </p>
      <Link
        href={`/${language}`}
        className="mt-6 underline underline-offset-4 hover:no-underline"
      >
        {t.back_home}
      </Link>
    </div>
  );
}
