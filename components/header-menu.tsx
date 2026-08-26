import Link from "next/link";
import { Suspense } from "react";
import { EllipsisVertical, ShoppingCart } from "lucide-react";
import type { Session } from "next-auth";
import LanguageToggle from "@/components/language-toggle";
import ModeToggle from "@/components/mode-toggle";
import UserButton from "@/components/user-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export default function HeaderMenu({
  lang,
  session,
  labels,
  cartLabel,
  cartQty,
  menuTitle,
}: {
  lang: Locale;
  session: Session | null;
  labels: Dictionary["user_button_text"];
  cartLabel: string;
  cartQty: number;
  menuTitle: string;
}) {
  const cartText = cartQty > 0 ? `${cartLabel} (${cartQty})` : cartLabel;

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex">
        <Suspense fallback={null}>
          <LanguageToggle lang={lang} />
        </Suspense>
        <ModeToggle />
        <Button asChild variant="ghost">
          <Link href={`/${lang}/cart`}>
            <ShoppingCart />
            {cartText}
          </Link>
        </Button>
        <UserButton lang={lang} session={session} labels={labels} />
      </nav>
      <nav className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={menuTitle}>
              <EllipsisVertical />
            </Button>
          </SheetTrigger>
          <SheetContent
            className="flex flex-col items-start gap-4 p-4"
            side="right"
          >
            <SheetTitle>{menuTitle}</SheetTitle>
            <Suspense fallback={null}>
              <LanguageToggle lang={lang} />
            </Suspense>
            <ModeToggle />
            <Button asChild variant="ghost" className="justify-start px-0">
              <Link href={`/${lang}/cart`}>
                <ShoppingCart />
                {cartText}
              </Link>
            </Button>
            <UserButton lang={lang} session={session} labels={labels} />
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
