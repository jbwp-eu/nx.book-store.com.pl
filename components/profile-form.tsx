"use client";

import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfile } from "@/lib/actions/user.actions";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validators";

const fieldClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";
const errorClass = "mt-1 text-sm text-red-600 dark:text-red-400";

export default function ProfileForm({
  lang,
  dictionary,
  name,
  email,
}: {
  lang: Locale;
  dictionary: Dictionary;
  name: string;
  email: string;
}) {
  const text = dictionary.user_profile_text;
  const [state, formAction, pending] = useActionState(
    updateProfile.bind(null, lang),
    { error: null, message: null },
  );

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema(lang)),
    defaultValues: { name },
  });

  const onSubmit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("name", values.name);
    startTransition(() => {
      formAction(data);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto mt-6 max-w-lg space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm">
          Email
        </label>
        <input
          id="email"
          type="email"
          disabled
          defaultValue={email}
          placeholder={text.placeholder_email}
          className={`${fieldClass} opacity-70`}
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm">
          {dictionary.update_user_text.name}
        </label>
        <input
          id="name"
          placeholder={text.placeholder_name}
          className={fieldClass}
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p className={errorClass}>{form.formState.errors.name.message}</p>
        ) : null}
      </div>
      {state.error ? <p className={errorClass}>{state.error}</p> : null}
      {state.message && !state.error ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? text.submitting : text.update_profile}
      </button>
    </form>
  );
}
