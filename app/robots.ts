import type { MetadataRoute } from "next";
import { SERVER_URL } from "@/lib/constants";
import { locales } from "@/lib/i18n";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        ...locales.map((lang) => `/${lang}/admin/`),
        ...locales.map((lang) => `/${lang}/user/`),
        ...locales.map((lang) => `/${lang}/order/`),
        ...locales.map((lang) => `/${lang}/cart`),
        ...locales.map((lang) => `/${lang}/shipping-address`),
        ...locales.map((lang) => `/${lang}/payment-method`),
        ...locales.map((lang) => `/${lang}/place-order`),
      ],
    },
    sitemap: `${SERVER_URL}/sitemap.xml`,
  };
}
