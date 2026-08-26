import type { Metadata } from "next";
import Link from "next/link";
import Pagination from "@/components/pagination";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  getAllCategories,
  getAllProducts,
} from "@/lib/actions/product.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

const priceValues = [
  "1-25",
  "26-50",
  "51-75",
  "76-100",
  "101-1000",
] as const;

const ratingValues = [4, 3, 2, 1];

type Params = Promise<{ lang: string }>;
type SearchParams = Promise<{
  q?: string;
  category?: string;
  price?: string;
  rating?: string;
  stock?: string;
  sort?: string;
  page?: string;
}>;

function resolveLocale(lang: string): Locale {
  return locales.includes(lang as Locale) ? (lang as Locale) : defaultLocale;
}

function categoryLabel(
  category: string,
  dictionary: Awaited<ReturnType<typeof getDictionary>>,
) {
  if (category === "Polish") return dictionary.search_text.category_polish;
  if (category === "Foreign") return dictionary.search_text.category_foreign;
  return category;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { lang } = await params;
  const { q, category, price, rating, stock } = await searchParams;
  const dictionary = await getDictionary(resolveLocale(lang));
  const hasQuery = Boolean(q && q !== "all" && q.trim());
  const hasCategory = Boolean(category && category !== "all");
  const hasPrice = Boolean(price && price !== "all");
  const hasRating = Boolean(rating && rating !== "all");
  const hasStock = stock === "in-stock";

  if (hasQuery || hasCategory || hasPrice || hasRating || hasStock) {
    return {
      title: [
        dictionary.metadata.search_label,
        hasQuery ? q : "",
        hasCategory
          ? `${dictionary.metadata.category_label} ${categoryLabel(category!, dictionary)}`
          : "",
        hasPrice ? `${dictionary.metadata.price_label} ${price}` : "",
        hasRating ? `${dictionary.metadata.rating_label} ${rating}` : "",
        hasStock ? dictionary.metadata.stock_label : "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim(),
    };
  }

  return { title: dictionary.metadata.search_products };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  const language = resolveLocale(lang);
  const {
    q = "all",
    category = "all",
    price = "all",
    rating = "all",
    stock = "all",
    sort = "newest",
    page = "1",
  } = await searchParams;
  const dictionary = await getDictionary(language);
  const searchText = dictionary.search_text;
  const pageNumber = Math.max(1, Number(page) || 1);

  const [productsResult, categories] = await Promise.all([
    getAllProducts({
      query: q,
      category,
      price,
      rating,
      stock,
      sort,
      page: pageNumber,
    }),
    getAllCategories(),
  ]);

  const { data: products, totalPages } = productsResult;

  const hasQuery = q !== "all" && q.trim() !== "";
  const hasCategory = category !== "all" && category !== "";
  const hasPrice = price !== "all";
  const hasRating = rating !== "all";
  const hasStock = stock === "in-stock";
  const hasFilters =
    hasQuery || hasCategory || hasPrice || hasRating || hasStock;

  const getFilterUrl = ({
    c,
    s,
    p,
    r,
    st,
    pg,
  }: {
    c?: string;
    s?: string;
    p?: string;
    r?: string;
    st?: string;
    pg?: string;
  }) => {
    const params = new URLSearchParams({
      q,
      category,
      price,
      rating,
      stock,
      sort,
      page,
    });

    if (c !== undefined) {
      params.set("category", c);
      params.set("page", "1");
    }
    if (s !== undefined) {
      params.set("sort", s);
      params.set("page", "1");
    }
    if (p !== undefined) {
      params.set("price", p);
      params.set("page", "1");
    }
    if (r !== undefined) {
      params.set("rating", r);
      params.set("page", "1");
    }
    if (st !== undefined) {
      params.set("stock", st);
      params.set("page", "1");
    }
    if (pg !== undefined) params.set("page", pg);

    return `/${language}/search?${params.toString()}`;
  };

  const prices = [
    { name: searchText.price_range_1_25, value: priceValues[0] },
    { name: searchText.price_range_26_50, value: priceValues[1] },
    { name: searchText.price_range_51_75, value: priceValues[2] },
    { name: searchText.price_range_76_100, value: priceValues[3] },
    { name: searchText.price_range_101_1000, value: priceValues[4] },
  ];

  const sorts = [
    { value: "newest", label: searchText.sort_newest },
    { value: "lowest", label: searchText.sort_lowest },
    { value: "highest", label: searchText.sort_highest },
    { value: "rating", label: searchText.sort_rating },
  ] as const;

  const filterLinkClass = (active: boolean) =>
    active
      ? "font-semibold text-foreground"
      : "text-zinc-600 hover:underline dark:text-zinc-400";

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.metadata.search_products}
      </h1>

      <div className="mt-6 grid gap-8 md:grid-cols-5">
        <aside className="space-y-8 md:col-span-1">
          <div>
            <h2 className="mb-3 text-lg font-semibold">
              {searchText.category_title.trim()}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={getFilterUrl({ c: "all" })}
                  className={filterLinkClass(
                    category === "all" || category === "",
                  )}
                >
                  {searchText.any_1}
                </Link>
              </li>
              {categories.map((item) => (
                <li key={item.category}>
                  <Link
                    href={getFilterUrl({ c: item.category })}
                    className={filterLinkClass(category === item.category)}
                  >
                    {categoryLabel(item.category, dictionary)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">
              {searchText.price_title}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={getFilterUrl({ p: "all" })}
                  className={filterLinkClass(price === "all")}
                >
                  {searchText.any_2}
                </Link>
              </li>
              {prices.map((item) => (
                <li key={item.value}>
                  <Link
                    href={getFilterUrl({ p: item.value })}
                    className={filterLinkClass(price === item.value)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">
              {searchText.ratings_title}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={getFilterUrl({ r: "all" })}
                  className={filterLinkClass(rating === "all")}
                >
                  {searchText.any_2}
                </Link>
              </li>
              {ratingValues.map((value) => (
                <li key={value}>
                  <Link
                    href={getFilterUrl({ r: String(value) })}
                    className={filterLinkClass(rating === String(value))}
                  >
                    {value} {searchText.stars_and_up}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">
              {searchText.stock_title}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={getFilterUrl({ st: "all" })}
                  className={filterLinkClass(stock === "all" || stock === "")}
                >
                  {searchText.any_2}
                </Link>
              </li>
              <li>
                <Link
                  href={getFilterUrl({ st: "in-stock" })}
                  className={filterLinkClass(stock === "in-stock")}
                >
                  {searchText.in_stock}
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        <div className="md:col-span-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {hasQuery ? `${searchText.query}${q}` : null}
              {hasQuery &&
              (hasCategory || hasPrice || hasRating || hasStock)
                ? " · "
                : null}
              {hasCategory
                ? `${searchText.category_title}${categoryLabel(category, dictionary)}`
                : null}
              {hasCategory && (hasPrice || hasRating || hasStock) ? " · " : null}
              {hasPrice ? `${searchText.price_info} ${price}` : null}
              {hasPrice && (hasRating || hasStock) ? " · " : null}
              {hasRating
                ? `${searchText.rating_info} ${rating} ${searchText.stars_and_up}`
                : null}
              {hasRating && hasStock ? " · " : null}
              {hasStock ? searchText.stock_info : null}
              {hasFilters ? (
                <>
                  {" "}
                  <Button variant="link" className="h-auto p-0" asChild>
                    <Link href={`/${language}/search`}>
                      {dictionary.button_text.clear}
                    </Link>
                  </Button>
                </>
              ) : null}
            </p>
            <p className="text-sm">
              {searchText.sort_by}
              {": "}
              {sorts.map((item) => (
                <Link
                  key={item.value}
                  href={getFilterUrl({ s: item.value })}
                  className={`mx-1 ${sort === item.value ? "font-semibold" : "underline-offset-4 hover:underline"}`}
                >
                  {item.label}
                </Link>
              ))}
            </p>
          </div>

          {products.length === 0 ? (
            <p className="mt-6 text-zinc-600 dark:text-zinc-400">
              {searchText.no_products}
            </p>
          ) : (
            <>
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    lang={language}
                    priority={index === 0 && pageNumber === 1}
                  />
                ))}
              </ul>
              <Pagination
                page={pageNumber}
                totalPages={totalPages}
                hrefForPage={(p) => getFilterUrl({ pg: String(p) })}
                previousLabel={dictionary.pagination_text.previous}
                nextLabel={dictionary.pagination_text.next}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
