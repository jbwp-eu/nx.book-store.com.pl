"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteAdminUser } from "@/lib/actions/user.actions";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n";

export default function DeleteUserButton({
  userId,
  lang,
  dictionary,
  disabled = false,
}: {
  userId: string;
  lang: Locale;
  dictionary: Dictionary;
  disabled?: boolean;
}) {
  const text = dictionary.delete_text;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (disabled) {
    return (
      <span className="text-muted-foreground text-xs">
        {lang === "en" ? "Current user" : "Bieżący użytkownik"}
      </span>
    );
  }

  return (
    <div>
      {!open ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
        >
          {text.del}
        </Button>
      ) : (
        <div className="border-destructive/40 space-y-2 rounded-md border p-2 text-xs">
          <p>{text.text_1}</p>
          <p className="text-muted-foreground">{text.text_2}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteAdminUser(lang, userId);
                  if (res.error) {
                    setMessage(res.error);
                    return;
                  }
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              {isPending ? text.deleting : text.del}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setOpen(false);
                setMessage(null);
              }}
            >
              {text.cancel}
            </Button>
          </div>
        </div>
      )}
      {message ? (
        <p className="text-destructive mt-1 text-xs">{message}</p>
      ) : null}
    </div>
  );
}
