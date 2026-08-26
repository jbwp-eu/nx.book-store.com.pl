import type { Metadata } from "next";
import Link from "next/link";
import AddToCart from "@/components/add-to-cart";
import ProductImage from "@/components/product-image";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

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
  return { title: dictionary.metadata.shopping_cart };
}

export default async function CartPage({ params }: { params: Params }) {
  const { lang } = await params;
  const language = asLocale(lang);
  const dictionary = await getDictionary(language);
  const cartText = dictionary.cart_text;
  const cart = await getMyCart();
  const items = cart?.items ?? [];

  if (!cart || items.length === 0) {
    return (
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          {cartText.title}
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {cartText.empty}{" "}
          <Link href={`/${language}`} className="underline">
            {cartText.go}
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">{cartText.title}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_16rem]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800"
            >
              <Link
                href={`/${language}/product/${item.slug}`}
                className="relative h-28 w-20 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900"
              >
                <ProductImage src={item.image} alt={item.name} sizes="80px" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${language}/product/${item.slug}`}
                  className="font-medium hover:underline"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {cartText.price}: {item.price} zł
                </p>
                <AddToCart
                  item={item}
                  qty={item.qty}
                  addLabel={dictionary.button_text.add_to_cart}
                  lang={language}
                />
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p>
            {cartText.subtotal} ({items.reduce((n, i) => n + i.qty, 0)}):{" "}
            <strong>{cart.itemsPrice} zł</strong>
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {cartText.price}: {cart.totalPrice} zł
          </p>
          <Link
            href={`/${language}/shipping-address`}
            className="mt-4 block rounded-md bg-zinc-900 px-4 py-2 text-center text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {cartText.proceed}
          </Link>
        </aside>
      </div>
    </section>
  );
}
