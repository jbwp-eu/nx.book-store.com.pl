import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductForm from "@/components/product-form";
import { getProductById } from "@/lib/actions/product.actions";
import { isAzureBlobConfigured } from "@/lib/azure-blob";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

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
  return { title: dictionary.metadata.update_product };
}

export default async function UpdateProductPage({
  params,
}: {
  params: Params;
}) {
  const { lang, id } = await params;
  const language = asLocale(lang);
  const product = await getProductById(id);
  if (!product) notFound();

  const dictionary = await getDictionary(language);

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.create_update_product_text.title_update}
      </h1>
      <ProductForm
        lang={language}
        dictionary={dictionary}
        mode="update"
        product={product}
        blobConfigured={isAzureBlobConfigured()}
      />
    </section>
  );
}
