"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type AdminNavItem = { label: string; href: string };

export default function AdminMainNav({
  lang,
  items,
  className,
  onNavigate,
}: {
  lang: string;
  items: AdminNavItem[];
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-4", className)}>
      {items.map((item) => {
        const href = `/${lang}${item.href}`;
        const active = pathname.includes(item.href);

        return (
          <Link
            key={item.href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
