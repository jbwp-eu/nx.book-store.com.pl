"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteOrder } from "@/lib/actions/order.actions";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n";

export default function DeleteOrderButton({
  orderId,
  lang,
  dictionary,
}: {
  orderId: string;
  lang: Locale;
  dictionary: Dictionary;
}) {
  const text = dictionary.delete_text;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
                  const res = await deleteOrder(lang, orderId);
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
