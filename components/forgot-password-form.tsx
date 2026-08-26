"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/user.actions";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export default function ForgotPasswordForm({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const text = dictionary.forgot_password_text;
  const [state, action, pending] = useActionState(
    requestPasswordReset.bind(null, lang),
    { error: null, success: false },
  );

  if (state.success) {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{text.success}</p>
        <Link href={`/${lang}/sign-in`} className="text-sm underline">
          {text.back_to_sign_in}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm">
          {text.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? text.submitting : text.submit}
      </button>
      <p className="text-sm">
        <Link href={`/${lang}/sign-in`} className="underline">
          {text.back_to_sign_in}
        </Link>
      </p>
    </form>
  );
}
