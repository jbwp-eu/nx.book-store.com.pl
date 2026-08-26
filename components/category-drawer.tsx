"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { Locale } from "@/lib/i18n";

type CategoryItem = { category: string; _count: number };

function categoryLabel(
  category: string,
  lang: Locale,
  labels: { polish: string; foreign: string },
) {
  if (lang === "en") return category;
  if (category === "Polish") return labels.polish;
  if (category === "Foreign") return labels.foreign;
  return category;
}

export default function CategoryDrawer({
  lang,
  categories,
  title,
  labels,
}: {
  lang: Locale;
  categories: CategoryItem[];
  title: string;
  labels: { polish: string; foreign: string };
}) {
  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={title}
          className="cursor-pointer rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <MenuIcon className="size-6" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="h-full">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="mt-4 space-y-1">
            {categories.map((item) => (
              <DrawerClose asChild key={item.category}>
                <Link
                  href={`/${lang}/search?category=${item.category}`}
                  className={buttonVariants({
                    variant: "ghost",
                    className: "w-full justify-start",
                  })}
                >
                  {categoryLabel(item.category, lang, labels)} ({item._count})
                </Link>
              </DrawerClose>
            ))}
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}
