import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/add-to-cart";
import ProductImages from "@/components/product-images";
import Rating from "@/components/rating";
import ReviewList from "@/components/review-list";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getProductBySlug } from "@/lib/actions/product.actions";
import { getReviews } from "@/lib/actions/review.actions";
import { auth } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

const DESCRIPTION_MAX_LENGTH = 155;

type Params = Promise<{ slug: string; lang: string }>;

function asLocale(lang: string): Locale {
  return locales.includes(lang as Locale) ? (lang as Locale) : defaultLocale;
}

function reviewCountLabel(
  count: number,
  text: { review: string; reviewNull: string; reviews: string },
) {
  if (count === 0) return text.reviewNull;
  if (count === 1) return text.review;
  return text.reviews;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, lang } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };

  const title = product.name;
  const description =
    product.description.length > DESCRIPTION_MAX_LENGTH
      ? `${product.description.slice(0, DESCRIPTION_MAX_LENGTH - 3)}...`
      : product.description;
  const image = product.images?.[0];
  const canonical = `/${lang}/product/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/product/${slug}`,
        pl: `/pl/product/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: APP_NAME,
      images: image ? [{ url: image, alt: product.name }] : undefined,
      locale: lang === "pl" ? "pl_PL" : "en_US",
      alternateLocale: lang === "pl" ? "en_US" : "pl_PL",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug, lang } = await params;
  const language = asLocale(lang);
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const dictionary = await getDictionary(language);
  const productText = dictionary.product_text;
  const session = await auth();
  const { data: initialReviews } = await getReviews({ productId: product.id });
  const inStock = product.stock > 0;
  const cart = await getMyCart();
  const qtyInCart =
    cart?.items.find((item) => item.productId === product.id)?.qty ?? 0;
  const ratingValue = Number(product.rating);
  const reviewCaption = `${product.numReviews} ${reviewCountLabel(
    product.numReviews,
    productText,
  )}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images?.length ? product.images : undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    sku: product.slug,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "PLN",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.numReviews > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.numReviews,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href={`/${language}`} className="hover:underline">
            {dictionary.product_list_text.title}
          </Link>
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
          <div className="md:col-span-2">
            <ProductImages images={product.images} alt={product.name} />
          </div>

          <div className="flex flex-col gap-6 md:col-span-2 md:p-5">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {product.brand}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              {product.name}
            </h1>
            <Rating value={ratingValue} caption={reviewCaption} />
            <p className="text-lg font-medium">
              <span className="inline-block rounded-full bg-green-100 px-5 py-2 text-green-700 dark:bg-green-950 dark:text-green-300">
                {product.price} zł
              </span>
            </p>
            <div>
              <p className="font-semibold">{productText.description}</p>
              <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
                {product.description}
              </p>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-2 flex justify-between text-sm">
                <span>{productText.price}</span>
                <span className="font-medium">{product.price} zł</span>
              </div>
              <div className="mb-4 flex justify-between text-sm">
                <span>{productText.status}</span>
                <span
                  className={
                    inStock
                      ? "rounded border border-zinc-300 px-2 py-0.5 text-xs dark:border-zinc-600"
                      : "rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
                  }
                >
                  {inStock
                    ? `${productText.in_stock} (${product.stock})`
                    : productText.out_of_stock}
                </span>
              </div>
              {inStock ? (
                <AddToCart
                  item={{
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    qty: 1,
                    image: product.images[0] ?? "/images/no-image.png",
                    price: product.price,
                  }}
                  qty={qtyInCart}
                  addLabel={dictionary.button_text.add_to_cart}
                  lang={language}
                />
              ) : null}
            </div>
          </div>
        </div>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            {dictionary.reviews_text.title}
          </h2>
          <ReviewList
            key={product.id}
            userId={session?.user?.id}
            productId={product.id}
            productSlug={product.slug}
            lang={language}
            reviewsText={dictionary.reviews_text}
            reviewFormText={dictionary.review_form_text}
            initialReviews={initialReviews}
          />
        </section>
      </article>
    </>
  );
}
