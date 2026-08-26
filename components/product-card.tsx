import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import ProductImage from "@/components/product-image";
import Rating from "@/components/rating";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: string;
  images: string[];
  rating?: string | number;
  numReviews?: number;
};

export default function ProductCard({
  product,
  lang,
  priority = false,
}: {
  product: ProductCardData;
  lang: Locale;
  priority?: boolean;
}) {
  const ratingValue = Number(product.rating ?? 0);

  return (
    <li className="w-full max-w-sm justify-self-center overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <Link
        href={`/${lang}/product/${product.slug}`}
        className="relative block aspect-[2/3] bg-zinc-100 dark:bg-zinc-900"
      >
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24rem"
          priority={priority}
        />
      </Link>
      <div className="p-4">
        <h2 className="text-sm font-medium">
          <Link
            href={`/${lang}/product/${product.slug}`}
            className="hover:underline"
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {product.brand}
        </p>
        <div className="mt-2">
          <Rating value={ratingValue} />
        </div>
        <p className="mt-2 text-sm">{product.price} zł</p>
      </div>
    </li>
  );
}
