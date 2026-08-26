"use client";

import { useState } from "react";
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import {
  approvePayPalOrder,
  createPayPalOrder,
} from "@/lib/actions/order.actions";
import type { Locale } from "@/lib/i18n";

function PayPalStatus({
  loadingLabel,
  errorLabel,
}: {
  loadingLabel: string;
  errorLabel: string;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  if (isPending) return <p className="text-sm text-zinc-600">{loadingLabel}</p>;
  if (isRejected) {
    return <p className="text-sm text-red-600 dark:text-red-400">{errorLabel}</p>;
  }
  return null;
}

export default function PaypalPayment({
  orderId,
  lang,
  clientId,
  loadingLabel,
  errorLabel,
}: {
  orderId: string;
  lang: Locale;
  clientId: string;
  loadingLabel: string;
  errorLabel: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mt-4 space-y-3">
      <PayPalScriptProvider options={{ clientId, currency: "PLN" }}>
        <PayPalStatus loadingLabel={loadingLabel} errorLabel={errorLabel} />
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={async () => {
            const res = await createPayPalOrder(orderId, lang);
            if (!res.success || !("data" in res) || !res.data) {
              setMessage(res.message ?? errorLabel);
              throw new Error(res.message ?? "PayPal create failed");
            }
            setMessage(null);
            return res.data;
          }}
          onApprove={async (data) => {
            const res = await approvePayPalOrder(
              orderId,
              { orderID: data.orderID },
              lang,
            );
            setMessage(res.message);
          }}
          onError={() => setMessage(errorLabel)}
        />
      </PayPalScriptProvider>
      {message ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{message}</p>
      ) : null}
    </div>
  );
}
