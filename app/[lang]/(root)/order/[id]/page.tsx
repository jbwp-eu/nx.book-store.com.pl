import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductImage from "@/components/product-image";
import OrderChat from "@/components/order-chat";
import PaypalPayment from "@/components/paypal-payment";
import StripePayment from "@/components/stripe-payment";
import { getOrderById } from "@/lib/actions/order.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { requireUser } from "@/lib/require-user";
import { formatShippingAddress } from "@/lib/shipping";
import { getStripe } from "@/lib/stripe";

type Params = Promise<{ lang: string; id: string }>;

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
  return { title: dictionary.metadata.order_details };
}

export default async function OrderPage({ params }: { params: Params }) {
  const { lang, id } = await params;
  const language = asLocale(lang);
  const session = await requireUser(language, `/order/${id}`);
  const order = await getOrderById(id, session.user.id, {
    asAdmin: session.user.role === "admin",
  });
  if (!order) notFound();

  const dictionary = await getDictionary(language);
  const text = dictionary.order_text;
  const chatText = dictionary.order_chat_text;
  const stripeText = dictionary.stripe_payment_text;

  let clientSecret: string | null = null;
  if (
    order.paymentMethod === "Stripe" &&
    !order.isPaid &&
    process.env.STRIPE_SECRET_KEY
  ) {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalPrice) * 100),
      currency: "pln",
      metadata: { orderId: order.id, lang: language },
    });
    clientSecret = paymentIntent.client_secret;
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">
        {text.title} #{order.id.slice(0, 8)}
      </h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium">{text.shipping_address}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {formatShippingAddress(order.shippingAddress)}
            </p>
            <p className="mt-2 text-sm">
              {order.isDelivered
                ? `${text.delivered_at} ${order.deliveredAt?.toISOString()}`
                : text.not_delivered}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium">{text.payment_method}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {order.paymentMethod}
            </p>
            <p className="mt-2 text-sm">
              {order.isPaid
                ? `${text.paid_at} ${order.paidAt?.toISOString()}`
                : text.not_paid}
            </p>
            {!order.isPaid &&
            order.paymentMethod === "Stripe" &&
            clientSecret ? (
              <StripePayment
                orderId={order.id}
                lang={language}
                clientSecret={clientSecret}
                defaultEmail={session.user.email ?? undefined}
                priceLabel={`${order.totalPrice} zł`}
                purchasing={stripeText.purchasing}
                purchase={stripeText.purchase}
                unknownError={stripeText.unknown_error}
                checkoutTitle={stripeText.checkout_title}
                emailHint={stripeText.email_hint}
                emailRequired={stripeText.email_required}
                missingKeyMessage={
                  language === "en"
                    ? "Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
                    : "Stripe nie jest skonfigurowany. Ustaw NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
                }
              />
            ) : null}
            {!order.isPaid &&
            order.paymentMethod === "Stripe" &&
            !process.env.STRIPE_SECRET_KEY ? (
              <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
                {language === "en"
                  ? "Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env"
                  : "Dodaj STRIPE_SECRET_KEY i NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY do .env"}
              </p>
            ) : null}
            {!order.isPaid &&
            order.paymentMethod === "PayPal" &&
            process.env.PAYPAL_CLIENT_ID ? (
              <PaypalPayment
                orderId={order.id}
                lang={language}
                clientId={process.env.PAYPAL_CLIENT_ID}
                loadingLabel={text.loading_paypal}
                errorLabel={text.error_loading_paypal}
              />
            ) : null}
            {!order.isPaid &&
            order.paymentMethod === "PayPal" &&
            !process.env.PAYPAL_CLIENT_ID ? (
              <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
                {language === "en"
                  ? "Add PAYPAL_CLIENT_ID and PAYPAL_APP_SECRET to .env"
                  : "Dodaj PAYPAL_CLIENT_ID i PAYPAL_APP_SECRET do .env"}
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium">{text.order_items}</h2>
            <ul className="mt-3 space-y-3">
              {order.orderItems.map((item) => (
                <li key={item.productId} className="flex gap-3 text-sm ">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden  bg-zinc-100 dark:bg-zinc-900">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/${language}/product/${item.slug}`}
                      className="font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {text.quantity}: {item.qty} · {item.price} zł
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <OrderChat
            orderId={order.id}
            currentUserId={session.user.id}
            labels={chatText}
          />
          <p className="text-sm">
            <Link href={`/${language}`} className="underline">
              {dictionary.not_found.back_home}
            </Link>
          </p>
        </div>
        <aside className="h-fit rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm">
            {text.items}: <strong>{order.itemsPrice} zł</strong>
          </p>
          <p className="mt-1 text-sm">
            {text.shipping}: <strong>{order.shippingPrice} zł</strong>
          </p>
          <p className="mt-1 text-sm">
            {text.tax}: <strong>{order.taxPrice} zł</strong>
          </p>
          <p className="mt-3">
            {text.total}: <strong>{order.totalPrice} zł</strong>
          </p>
        </aside>
      </div>
    </section>
  );
}
