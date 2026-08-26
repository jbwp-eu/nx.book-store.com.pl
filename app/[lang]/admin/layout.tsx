import Link from "next/link";
import { Suspense } from "react";
import AdminMainNav from "@/components/admin-main-nav";
import AdminMenu from "@/components/admin-menu";
import LanguageToggle from "@/components/language-toggle";
import ModeToggle from "@/components/mode-toggle";
import SignOutButton from "@/components/sign-out-button";
import { requireAdmin } from "@/lib/require-admin";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/get-dictionary";

function asLocale(lang: string): Locale {
  return locales.includes(lang as Locale) ? (lang as Locale) : defaultLocale;
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = asLocale(lang);
  await requireAdmin(language);
  const dictionary = await getDictionary(language);
  const nav = dictionary.nav_admin_text;

  const items = [
    { href: "/admin/overview", label: nav.overview },
    { href: "/admin/orders", label: nav.orders },
    { href: "/admin/products", label: nav.products },
    { href: "/admin/users", label: nav.users },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="wrapper flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/${language}`} className="font-semibold">
              BookStore
            </Link>
            <AdminMainNav
              lang={language}
              items={items}
              className="hidden lg:flex"
            />
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            <Suspense fallback={null}>
              <LanguageToggle lang={language} />
            </Suspense>
            <ModeToggle />
            <SignOutButton
              lang={language}
              label={dictionary.user_button_text.sign_out}
            />
          </div>
          <AdminMenu
            lang={language}
            items={items}
            menuTitle={dictionary.header_text.menu}
          >
            <SignOutButton
              lang={language}
              label={dictionary.user_button_text.sign_out}
            />
          </AdminMenu>
        </div>
      </header>
      <p className="bg-amber-50 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <span className="wrapper block">{dictionary.demo_notice}</span>
      </p>
      <main className="wrapper flex-1 py-8">{children}</main>
    </div>
  );
}
