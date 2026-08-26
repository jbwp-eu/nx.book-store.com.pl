import type { Metadata } from "next";
import { notFound } from "next/navigation";
import UpdateUserForm from "@/components/update-user-form";
import { getAdminUserById } from "@/lib/actions/user.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

type Params = Promise<{ lang: string; id: string }>;

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
  return { title: dictionary.metadata.update_user };
}

export default async function AdminUserUpdatePage({
  params,
}: {
  params: Params;
}) {
  const { lang, id } = await params;
  const language = asLocale(lang);
  const user = await getAdminUserById(id);
  if (!user) notFound();

  const dictionary = await getDictionary(language);

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.update_user_text.title}
      </h1>
      <UpdateUserForm lang={language} dictionary={dictionary} user={user} />
    </section>
  );
}
