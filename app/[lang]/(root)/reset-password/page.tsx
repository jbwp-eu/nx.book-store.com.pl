import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/reset-password-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

type Params = Promise<{ lang: string }>;
type SearchParams = Promise<{ token?: string }>;

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
  return { title: dictionary.reset_password_text.title };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  const language = asLocale(lang);
  const { token } = await searchParams;
  const dictionary = await getDictionary(language);
  const text = dictionary.reset_password_text;

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {text.description}
      </p>
      {token ? (
        <ResetPasswordForm
          lang={language}
          token={token}
          dictionary={dictionary}
        />
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            {text.invalid_token}
          </p>
          <Link href={`/${language}/forgot-password`} className="text-sm underline">
            {dictionary.forgot_password_text.title}
          </Link>
        </div>
      )}
    </section>
  );
}
