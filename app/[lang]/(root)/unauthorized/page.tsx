import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

type Params = Promise<{ lang: string }>;

function asLocale(lang: string): Locale {
  return locales.includes(lang as Locale) ? (lang as Locale) : defaultLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(asLocale(lang));
  return { title: dictionary.metadata.unauthorized_access };
}

export default async function UnauthorizedPage({
  params,
}: {
  params: Params;
}) {
  const { lang } = await params;
  const language = asLocale(lang);
  const dictionary = await getDictionary(language);
  const text = dictionary.unauthorized;

  return (
    <section className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">{text.text}</p>
      <Link
        href={`/${language}`}
        className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        {text.button_text}
      </Link>
    </section>
  );
}
