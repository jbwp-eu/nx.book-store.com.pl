"use client";

import { useState, type SubmitEvent } from "react";
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { Locale } from "@/lib/i18n";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function StripeForm({
  orderId,
  lang,
  priceLabel,
  purchasing,
  purchase,
  unknownError,
  checkoutTitle,
}: {
  orderId: string;
  lang: Locale;
  priceLabel: string;
  purchasing: string;
  purchase: string;
  unknownError: string;
  checkoutTitle: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements || !email) return;

    setIsLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${getAppUrl()}/${lang}/order/${orderId}/stripe-payment-success`,
      },
    });

    if (error?.type === "card_error" || error?.type === "validation_error") {
      setErrorMessage(error.message ?? unknownError);
    } else if (error) {
      setErrorMessage(unknownError);
    }
    setIsLoading(false);
  };

  return (
    <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-lg font-medium">{checkoutTitle}</h2>
      {errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : null}
      <PaymentElement />
      <LinkAuthenticationElement
        onChange={(event) => setEmail(event.value.email)}
      />
      <button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isLoading ? purchasing : `${purchase} ${priceLabel}`}
      </button>
    </form>
  );
}

export default function StripePayment({
  orderId,
  lang,
  clientSecret,
  priceLabel,
  purchasing,
  purchase,
  unknownError,
  checkoutTitle,
  missingKeyMessage,
}: {
  orderId: string;
  lang: Locale;
  clientSecret: string;
  priceLabel: string;
  purchasing: string;
  purchase: string;
  unknownError: string;
  checkoutTitle: string;
  missingKeyMessage: string;
}) {
  if (!stripePromise) {
    return (
      <p className="mt-4 text-sm text-red-600 dark:text-red-400">
        {missingKeyMessage}
      </p>
    );
  }

  return (
    <Elements
      options={{ clientSecret, appearance: { theme: "stripe" } }}
      stripe={stripePromise}
    >
      <StripeForm
        orderId={orderId}
        lang={lang}
        priceLabel={priceLabel}
        purchasing={purchasing}
        purchase={purchase}
        unknownError={unknownError}
        checkoutTitle={checkoutTitle}
      />
    </Elements>
  );
}
