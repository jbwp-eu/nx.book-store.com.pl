"use client";

import { useActionState } from "react";
import { updateAdminUser } from "@/lib/actions/user.actions";
import { USER_ROLES } from "@/lib/user-roles";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n";

const fieldClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

export default function UpdateUserForm({
  lang,
  dictionary,
  user,
}: {
  lang: Locale;
  dictionary: Dictionary;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}) {
  const text = dictionary.update_user_text;
  const usersText = dictionary.users_text;
  const [state, formAction, pending] = useActionState(
    updateAdminUser.bind(null, lang, user.id),
    { error: null },
  );

  return (
    <form action={formAction} className="mx-auto mt-6 max-w-lg space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm">
          {text.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          disabled
          defaultValue={user.email}
          placeholder={text.placeholder_email}
          className={`${fieldClass} opacity-70`}
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm">
          {text.name}
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={user.name}
          placeholder={text.placeholder_name}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm">
          {text.role}
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue={user.role}
          className={fieldClass}
        >
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {role === "admin" ? usersText.admin : usersText.user}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? text.submitting : text.title}
      </button>
    </form>
  );
}
