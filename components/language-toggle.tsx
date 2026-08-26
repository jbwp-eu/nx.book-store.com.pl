"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

export default function LanguageToggle({ lang }: { lang: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const redirectedPathname = (locale: Locale) => {
    if (!pathname) return `/${locale}`;
    const segments = pathname.split("/");
    segments[1] = locale;
    const path = segments.join("/") || `/${locale}`;
    const query = searchParams.toString();
    return query ? `${path}?${query}` : path;
  };

  return (
    <nav className="flex gap-3 text-sm" aria-label="Language">
      {locales.map((locale) => {
        const isActive = locale === lang;
        return (
          <Link
            key={locale}
            href={redirectedPathname(locale)}
            hrefLang={locale}
            aria-current={isActive ? "true" : undefined}
            className={
              isActive
                ? "font-semibold uppercase underline underline-offset-4"
                : "uppercase underline-offset-4 hover:underline"
            }
          >
            {locale}
          </Link>
        );
      })}
    </nav>
  );
}
