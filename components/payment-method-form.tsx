"use client";

import { useActionState } from "react";
import { updateUserPaymentMethod } from "@/lib/actions/user.actions";
import { PAYMENT_METHODS } from "@/lib/shipping";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const labels: Record<(typeof PAYMENT_METHODS)[number], { pl: string; en: string }> =
  {
    PayPal: {
      pl: "PayPal",
      en: "PayPal",
    },
    Stripe: {
      pl: "Stripe",
      en: "Stripe",
    },
  };

export default function PaymentMethodForm({
  lang,
  dictionary,
  current,
}: {
  lang: Locale;
  dictionary: Dictionary;
  current?: string | null;
}) {
  const text = dictionary.payment_method_text;
  const [state, action, pending] = useActionState(
    updateUserPaymentMethod.bind(null, lang),
    { error: null },
  );

  return (
    <form action={action} className="mx-auto mt-4 max-w-lg space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {text.description}
      </p>
      <fieldset className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <label key={method} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              defaultChecked={current === method || (!current && method === "PayPal")}
              required
            />
            {labels[method][lang]}
          </label>
        ))}
      </fieldset>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {dictionary.button_text.continue}
      </button>
    </form>
  );
}
