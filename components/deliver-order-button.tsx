"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deliverOrder } from "@/lib/actions/order.actions";
import type { Locale } from "@/lib/i18n";

export default function DeliverOrderButton({
  orderId,
  lang,
  label,
  processingLabel,
}: {
  orderId: string;
  lang: Locale;
  label: string;
  processingLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await deliverOrder(orderId, lang);
            setMessage(res.message);
          })
        }
      >
        {isPending ? processingLabel : label}
      </Button>
      {message ? (
        <p className="text-muted-foreground mt-1 text-xs">{message}</p>
      ) : null}
    </div>
  );
}
