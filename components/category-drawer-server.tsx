import CategoryDrawer from "@/components/category-drawer";
import { getAllCategories } from "@/lib/actions/product.actions";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export default async function CategoryDrawerServer({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const categories = await getAllCategories();

  return (
    <CategoryDrawer
      lang={lang}
      categories={categories}
      title={dictionary.header_text.category}
      labels={{
        polish: dictionary.search_text.category_polish,
        foreign: dictionary.search_text.category_foreign,
      }}
    />
  );
}
