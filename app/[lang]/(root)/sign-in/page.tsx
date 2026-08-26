import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignInForm from "@/components/sign-in-form";
import { auth } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

type Params = Promise<{ lang: string }>;
type SearchParams = Promise<{ callbackUrl?: string }>;

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
  return { title: dictionary.metadata.sign_in };
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  const language = asLocale(lang);
  const { callbackUrl } = await searchParams;
  const session = await auth();
  if (session) redirect(callbackUrl || `/${language}`);

  const dictionary = await getDictionary(language);

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.sign_in_text.title}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {dictionary.sign_in_text.description}
      </p>
      <SignInForm
        lang={language}
        callbackUrl={callbackUrl}
        dictionary={dictionary}
      />
    </section>
  );
}
