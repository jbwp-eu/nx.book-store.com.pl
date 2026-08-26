"use client";

import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserAddress } from "@/lib/actions/user.actions";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { ShippingAddress } from "@/lib/shipping";
import {
  shippingAddressSchema,
  type ShippingAddressInput,
} from "@/lib/validators";

const fieldClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";
const errorClass = "mt-1 text-sm text-red-600 dark:text-red-400";

export default function ShippingAddressForm({
  lang,
  dictionary,
  address,
}: {
  lang: Locale;
  dictionary: Dictionary;
  address?: ShippingAddress | null;
}) {
  const text = dictionary.shipping_form_text;
  const [state, formAction, pending] = useActionState(
    updateUserAddress.bind(null, lang),
    { error: null },
  );

  const form = useForm<ShippingAddressInput>({
    resolver: zodResolver(shippingAddressSchema(lang)),
    defaultValues: {
      fullName: address?.fullName ?? "",
      streetAddress: address?.streetAddress ?? "",
      city: address?.city ?? "",
      postalCode: address?.postalCode ?? "",
      country: address?.country ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("fullName", values.fullName);
    data.set("streetAddress", values.streetAddress);
    data.set("city", values.city);
    data.set("postalCode", values.postalCode);
    data.set("country", values.country);
    startTransition(() => {
      formAction(data);
    });
  });

  const fields = [
    ["fullName", text.full_name_label, text.enter_full_name],
    ["streetAddress", text.address_label, text.enter_address],
    ["city", text.city_label, text.enter_city],
    ["postalCode", text.postal_code_label, text.enter_postal_code],
    ["country", text.country_label, text.enter_country],
  ] as const;

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto mt-4 max-w-lg space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {text.please_enter}
      </p>
      {fields.map(([name, label, placeholder]) => (
        <div key={name}>
          <label htmlFor={name} className="block text-sm">
            {label}
          </label>
          <input
            id={name}
            placeholder={placeholder}
            className={fieldClass}
            {...form.register(name)}
          />
          {form.formState.errors[name] ? (
            <p className={errorClass}>{form.formState.errors[name]?.message}</p>
          ) : null}
        </div>
      ))}
      {state.error ? <p className={errorClass}>{state.error}</p> : null}
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
