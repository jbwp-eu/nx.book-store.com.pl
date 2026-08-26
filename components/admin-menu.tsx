"use client";

import { Suspense, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import AdminMainNav, { type AdminNavItem } from "@/components/admin-main-nav";
import LanguageToggle from "@/components/language-toggle";
import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Locale } from "@/lib/i18n";

export default function AdminMenu({
  lang,
  items,
  menuTitle,
  children,
}: {
  lang: Locale;
  items: AdminNavItem[];
  menuTitle: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
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
          <AdminMainNav
            lang={lang}
            items={items}
            className="flex-col items-start space-y-4"
            onNavigate={() => setOpen(false)}
          />
          <Suspense fallback={null}>
            <LanguageToggle lang={lang} />
          </Suspense>
          <ModeToggle />
          {children}
        </SheetContent>
      </Sheet>
    </nav>
  );
}
