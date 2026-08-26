import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutSteps from "@/components/checkout-steps";
import PlaceOrderButton from "@/components/place-order-button";
import ProductImage from "@/components/product-image";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { requireUser } from "@/lib/require-user";
import {
  formatShippingAddress,
  type ShippingAddress,
} from "@/lib/shipping";

type Params = Promise<{ lang: string }>;

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
  return { title: dictionary.metadata.place_order };
}

export default async function PlaceOrderPage({ params }: { params: Params }) {
  const { lang } = await params;
  const language = asLocale(lang);
  const session = await requireUser(language, "/place-order");
  const cart = await getMyCart();
  if (!cart || cart.items.length === 0) redirect(`/${language}/cart`);

  const user = await getUserById(session.user.id);
  if (!user?.address) redirect(`/${language}/shipping-address`);
  if (!user.paymentMethod) redirect(`/${language}/payment-method`);

  const dictionary = await getDictionary(language);
  const text = dictionary.place_order_text;
  const address = user.address as ShippingAddress;

  return (
    <section>
      <CheckoutSteps current={3} labels={dictionary.checkout_steps_text} />
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-medium">{text.shipping_address}</h2>
              <Link
                href={`/${language}/shipping-address`}
                className="text-sm underline"
              >
                {dictionary.button_text.edit}
              </Link>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {formatShippingAddress(address)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-medium">{text.payment_method}</h2>
              <Link
                href={`/${language}/payment-method`}
                className="text-sm underline"
              >
                {dictionary.button_text.edit}
              </Link>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {user.paymentMethod}
            </p>
          </div>
          <div>
            <h2 className="font-medium">{text.order_items}</h2>
            <ul className="mt-3 space-y-3">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex gap-3 text-sm">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
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
        </div>
        <aside className="h-fit rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm">
            {text.items}: <strong>{cart.itemsPrice} zł</strong>
          </p>
          <p className="mt-1 text-sm">
            {text.shipping}: <strong>{cart.shippingPrice} zł</strong>
          </p>
          <p className="mt-1 text-sm">
            {text.tax}: <strong>{cart.taxPrice} zł</strong>
          </p>
          <p className="mt-3">
            {text.total}: <strong>{cart.totalPrice} zł</strong>
          </p>
          <PlaceOrderButton
            lang={language}
            label={dictionary.button_text.place_order}
          />
        </aside>
      </div>
    </section>
  );
}
