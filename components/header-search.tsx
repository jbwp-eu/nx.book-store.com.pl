import { getAllCategories } from "@/lib/actions/product.actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export default async function HeaderSearch({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const categories = await getAllCategories();
  const search = dictionary.header_text.search;
  const searchText = dictionary.search_text;

  return (
    <form
      action={`/${lang}/search`}
      method="GET"
      className="flex w-full flex-wrap items-center gap-2"
    >
      <label className="sr-only" htmlFor="search-category">
        {search.placeholder_select}
      </label>
      <select
        id="search-category"
        name="category"
        defaultValue="all"
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      >
        <option value="all">{search.placeholder_select}</option>
        {categories.map((item) => (
          <option key={item.category} value={item.category}>
            {item.category === "Polish"
              ? searchText.category_polish
              : item.category === "Foreign"
                ? searchText.category_foreign
                : item.category}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="search-q">
        {search.placeholder_input}
      </label>
      <input
        id="search-q"
        name="q"
        type="search"
        placeholder={search.placeholder_input}
        className="w-40 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm sm:w-56 dark:border-zinc-700 dark:bg-zinc-950"
      />
      <Button type="submit" size="sm">
        {searchText.search}
      </Button>
    </form>
  );
}
