import type { MetadataRoute } from "next";
import { getProductSlugs } from "@/lib/actions/product.actions";
import { SERVER_URL } from "@/lib/constants";
import { locales } from "@/lib/i18n";

/** DB-backed entries — generate at request time (CI build has no DB access). */
export const dynamic = "force-dynamic";

/** Public indexable pages only (cart/checkout stay out — see robots.txt). */
const staticPaths = ["", "search", "sign-in", "sign-up", "forgot-password"];

function staticEntries(base: string): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const lang of locales) {
    for (const path of staticPaths) {
      const pathSegment = path ? `/${path}` : "";
      entries.push({
        url: `${base}/${lang}${pathSegment}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${base}/${l}${pathSegment}`]),
          ),
        },
      });
    }
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SERVER_URL;
  const entries = staticEntries(base);

  try {
    const products = await getProductSlugs();
    for (const lang of locales) {
      for (const { slug, createdAt } of products) {
        entries.push({
          url: `${base}/${lang}/product/${slug}`,
          lastModified: createdAt,
          changeFrequency: "weekly",
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [l, `${base}/${l}/product/${slug}`]),
            ),
          },
        });
      }
    }
  } catch {
    // Runtime DB unavailable — still serve static URLs for crawlers.
  }

  return entries;
}
