import type { Metadata } from "next";
import ProductForm from "@/components/product-form";
import { isAzureBlobConfigured } from "@/lib/azure-blob";
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
  return { title: dictionary.metadata.create_product };
}

export default async function CreateProductPage({
  params,
}: {
  params: Params;
}) {
  const { lang } = await params;
  const language = asLocale(lang);
  const dictionary = await getDictionary(language);

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.create_update_product_text.title_create}
      </h1>
      <ProductForm
        lang={language}
        dictionary={dictionary}
        mode="create"
        blobConfigured={isAzureBlobConfigured()}
      />
    </section>
  );
}
