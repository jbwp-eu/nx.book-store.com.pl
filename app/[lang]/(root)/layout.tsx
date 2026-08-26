import Link from "next/link";
import CategoryDrawerServer from "@/components/category-drawer-server";
import Footer from "@/components/footer";
import HeaderMenu from "@/components/header-menu";
import HeaderSearch from "@/components/header-search";
import { getMyCart } from "@/lib/actions/cart.actions";
import { cartQty } from "@/lib/cart";
import { auth } from "@/lib/auth";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language: Locale = locales.includes(lang as Locale)
    ? (lang as Locale)
    : defaultLocale;

  const dictionary = await getDictionary(language);
  const session = await auth();
  const cart = await getMyCart();
  const qty = cart ? cartQty(cart.items) : 0;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="wrapper flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CategoryDrawerServer lang={language} dictionary={dictionary} />
              <Link href={`/${language}`} className="font-semibold">
                BookStore
              </Link>
            </div>
            <div className="hidden flex-1 justify-center md:flex">
              <HeaderSearch lang={language} dictionary={dictionary} />
            </div>
            <HeaderMenu
              lang={language}
              session={session}
              labels={dictionary.user_button_text}
              cartLabel={dictionary.header_text.cart}
              cartQty={qty}
              menuTitle={dictionary.header_text.menu}
            />
          </div>
          <div className="md:hidden">
            <HeaderSearch lang={language} dictionary={dictionary} />
          </div>
        </div>
      </header>
      <p className="bg-amber-50 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <span className="wrapper block">{dictionary.demo_notice}</span>
      </p>
      <main className="wrapper flex-1 py-8">{children}</main>
      <Footer lang={language} dictionary={dictionary} />
    </div>
  );
}
