"use client";

import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signUpUser } from "@/lib/actions/user.actions";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { signUpSchema, type SignUpInput } from "@/lib/validators";

const fieldClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";
const errorClass = "mt-1 text-sm text-red-600 dark:text-red-400";

export default function SignUpForm({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const text = dictionary.sign_up_text;
  const [state, formAction, pending] = useActionState(
    signUpUser.bind(null, lang),
    { error: null },
  );

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema(lang)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("name", values.name);
    data.set("email", values.email);
    data.set("password", values.password);
    data.set("confirmPassword", values.confirmPassword);
    startTransition(() => {
      formAction(data);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm">
          {text.name}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className={fieldClass}
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p className={errorClass}>{form.formState.errors.name.message}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm">
          {text.email}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={fieldClass}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className={errorClass}>{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm">
          {text.password}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={fieldClass}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className={errorClass}>{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm">
          {text.confirmPassword}
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={fieldClass}
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className={errorClass}>
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </div>
      {state.error ? <p className={errorClass}>{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? text.submitting : text.sign_up}
      </button>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {text.text}{" "}
        <Link href={`/${lang}/sign-in`} className="underline">
          {text.sign_in}
        </Link>
      </p>
    </form>
  );
}
