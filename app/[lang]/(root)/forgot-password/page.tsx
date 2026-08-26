import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/forgot-password-form";
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
  return { title: dictionary.forgot_password_text.title };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Params;
}) {
  const { lang } = await params;
  const language = asLocale(lang);
  const dictionary = await getDictionary(language);

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.forgot_password_text.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {dictionary.forgot_password_text.description}
      </p>
      <ForgotPasswordForm lang={language} dictionary={dictionary} />
    </section>
  );
}
