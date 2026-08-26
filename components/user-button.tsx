"use client";

import Link from "next/link";
import { UserIcon } from "lucide-react";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutUser } from "@/lib/actions/user.actions";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n";

export default function UserButton({
  lang,
  session,
  labels,
}: {
  lang: Locale;
  session: Session | null;
  labels: Dictionary["user_button_text"];
}) {
  if (!session?.user) {
    return (
      <Button asChild size="sm">
        <Link href={`/${lang}/sign-in`}>
          <UserIcon />
          {labels.sign_in}
        </Link>
      </Button>
    );
  }

  const firstInitial = session.user.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700"
        >
          {firstInitial}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">
              {session.user.name}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${lang}/user/profile`} className="w-full cursor-pointer">
            {labels.user_profile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${lang}/user/orders`} className="w-full cursor-pointer">
            {labels.order_history}
          </Link>
        </DropdownMenuItem>
        {session.user.role === "admin" ? (
          <DropdownMenuItem asChild>
            <Link
              href={`/${lang}/admin/overview`}
              className="w-full cursor-pointer"
            >
              {labels.admin}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutUser.bind(null, lang)} className="w-full">
            <button type="submit" className="w-full cursor-pointer text-left">
              {labels.sign_out}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
