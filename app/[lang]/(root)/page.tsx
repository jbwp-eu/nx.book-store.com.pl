import type { Metadata } from "next";
import ProductCard from "@/components/product-card";
import ProductCarousel from "@/components/product-carousel";
import ViewAllProductsButton from "@/components/view-all-products-button";
import {
  getFeaturedProducts,
  getLatestProducts,
} from "@/lib/actions/product.actions";
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from "@/lib/constants";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { lang } = await params;
  const language: Locale = locales.includes(lang as Locale)
    ? (lang as Locale)
    : defaultLocale;
  const dictionary = await getDictionary(language);
  return { title: dictionary.metadata.home };
}

export default async function HomePage({ params }: { params: Params }) {
  const { lang } = await params;
  const language: Locale = locales.includes(lang as Locale)
    ? (lang as Locale)
    : defaultLocale;
  const dictionary = await getDictionary(language);
  const [products, featuredProducts] = await Promise.all([
    getLatestProducts(),
    getFeaturedProducts(),
  ]);

  const siteUrl = `${SERVER_URL}/${language}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: APP_NAME,
        url: siteUrl,
        description: APP_DESCRIPTION,
        inLanguage: language,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SERVER_URL}/${language}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: APP_NAME,
        url: siteUrl,
        description: APP_DESCRIPTION,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {featuredProducts.length > 0 ? (
        <ProductCarousel data={featuredProducts} lang={language} />
      ) : null}
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dictionary.product_list_text.title}
        </h1>
        {products.length === 0 ? (
          <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
            {dictionary.product_list_text.no_products}
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={language}
                priority={index === 0}
              />
            ))}
          </ul>
        )}
        <ViewAllProductsButton
          lang={language}
          label={dictionary.button_text.view_all_products}
        />
      </section>
    </>
  );
}
