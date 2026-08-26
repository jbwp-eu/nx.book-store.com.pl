import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getOrderById,
  updateOrderToPaid,
} from "@/lib/actions/order.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { requireUser } from "@/lib/require-user";
import { getStripe } from "@/lib/stripe";

type Params = Promise<{ lang: string; id: string }>;
type SearchParams = Promise<{ payment_intent?: string }>;

function asLocale(lang: string): Locale {
  return locales.includes(lang as Locale) ? (lang as Locale) : defaultLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(asLocale(lang));
  return { title: dictionary.stripe_success_text.thanks };
}

export default async function StripePaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { lang, id } = await params;
  const language = asLocale(lang);
  const { payment_intent: paymentIntentId } = await searchParams;
  const session = await requireUser(language, `/order/${id}`);
  const order = await getOrderById(id, session.user.id);
  if (!order || !paymentIntentId) notFound();

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.metadata.orderId !== order.id) {
    notFound();
  }

  if (paymentIntent.status !== "succeeded") {
    redirect(`/${language}/order/${id}`);
  }

  await updateOrderToPaid(order.id, language);

  const dictionary = await getDictionary(language);
  const text = dictionary.stripe_success_text;

  return (
    <section className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{text.thanks}</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">{text.processing}</p>
      <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {text.demo_notice}
      </p>
      <Link
        href={`/${language}/order/${id}`}
        className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        {text.view_order}
      </Link>
    </section>
  );
}
