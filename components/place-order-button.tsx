"use client";

import { useTransition } from "react";
import { createOrder } from "@/lib/actions/order.actions";
import type { Locale } from "@/lib/i18n";

export default function PlaceOrderButton({
  lang,
  label,
}: {
  lang: Locale;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          void createOrder(lang);
        })
      }
      className="mt-4 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {isPending ? "…" : label}
    </button>
  );
}
