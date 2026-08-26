import type { Metadata } from "next";
import ProfileForm from "@/components/profile-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { requireUser } from "@/lib/require-user";

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
  return { title: dictionary.metadata.user_profile };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { lang } = await params;
  const language = asLocale(lang);
  const session = await requireUser(language, "/user/profile");
  const dictionary = await getDictionary(language);

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.user_profile_text.title}
      </h1>
      <ProfileForm
        key={session.user.name ?? session.user.email ?? "profile"}
        lang={language}
        dictionary={dictionary}
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
      />
    </section>
  );
}
