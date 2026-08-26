"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithCredentials } from "@/lib/actions/user.actions";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export default function SignInForm({
  lang,
  callbackUrl,
  dictionary,
}: {
  lang: Locale;
  callbackUrl?: string;
  dictionary: Dictionary;
}) {
  const text = dictionary.sign_in_text;
  const [state, action, pending] = useActionState(
    signInWithCredentials.bind(null, lang, callbackUrl),
    { error: null },
  );

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
      <div>
        <label htmlFor="password" className="block text-sm">
          {text.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
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
        {pending ? text.signing_in : text.sign_in}
      </button>
      <p className="text-sm">
        <Link href={`/${lang}/forgot-password`} className="underline">
          {text.forgot_password}
        </Link>
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {text.text}{" "}
        <Link href={`/${lang}/sign-up`} className="underline">
          {text.sign_up}
        </Link>
      </p>
    </form>
  );
}
