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
  defaultEmail,
  priceLabel,
  purchasing,
  purchase,
  unknownError,
  checkoutTitle,
  emailHint,
  emailRequired,
}: {
  orderId: string;
  lang: Locale;
  defaultEmail?: string;
  priceLabel: string;
  purchasing: string;
  purchase: string;
  unknownError: string;
  checkoutTitle: string;
  emailHint: string;
  emailRequired: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState(defaultEmail ?? "");

  const emailTrimmed = email.trim();
  const canSubmit = Boolean(stripe && elements && emailTrimmed && !isLoading);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!stripe || !elements) return;
    if (!emailTrimmed) {
      setErrorMessage(emailRequired);
      return;
    }

    setIsLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${getAppUrl()}/${lang}/order/${orderId}/stripe-payment-success`,
        receipt_email: emailTrimmed,
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
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <LinkAuthenticationElement
        options={{
          defaultValues: defaultEmail ? { email: defaultEmail } : undefined,
        }}
        onChange={(event) => setEmail(event.value.email)}
      />
      {!emailTrimmed && stripe && elements ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">{emailHint}</p>
      ) : null}
      <PaymentElement />
      <button
        type="submit"
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
        title={!emailTrimmed ? emailRequired : undefined}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
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
  defaultEmail,
  priceLabel,
  purchasing,
  purchase,
  unknownError,
  checkoutTitle,
  emailHint,
  emailRequired,
  missingKeyMessage,
}: {
  orderId: string;
  lang: Locale;
  clientSecret: string;
  defaultEmail?: string;
  priceLabel: string;
  purchasing: string;
  purchase: string;
  unknownError: string;
  checkoutTitle: string;
  emailHint: string;
  emailRequired: string;
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
        defaultEmail={defaultEmail}
        priceLabel={priceLabel}
        purchasing={purchasing}
        purchase={purchase}
        unknownError={unknownError}
        checkoutTitle={checkoutTitle}
        emailHint={emailHint}
        emailRequired={emailRequired}
      />
    </Elements>
  );
}
