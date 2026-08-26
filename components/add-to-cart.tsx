"use client";

import { useState, useTransition } from "react";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import type { CartItem } from "@/lib/cart";
import type { Locale } from "@/lib/i18n";

export default function AddToCart({
  item,
  qty,
  addLabel,
  lang,
}: {
  item: CartItem;
  qty: number;
  addLabel: string;
  lang: Locale;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    startTransition(async () => {
      const res = await addItemToCart(item, lang);
      setError(res.success ? null : res.message);
    });
  };

  const remove = () => {
    startTransition(async () => {
      const res = await removeItemFromCart(item.productId, lang);
      setError(res.success ? null : res.message);
    });
  };

  return (
    <div className="mt-4">
      {qty > 0 ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-3 py-1 dark:border-zinc-700"
            aria-label="-"
          >
            −
          </button>
          <span>{qty}</span>
          <button
            type="button"
            onClick={add}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-3 py-1 dark:border-zinc-700"
            aria-label="+"
          >
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={add}
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {addLabel}
        </button>
      )}
      {error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
