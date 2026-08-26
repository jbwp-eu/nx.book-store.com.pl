import type { Metadata } from "next";
import Link from "next/link";
import DeleteProductButton from "@/components/delete-product-button";
import Pagination from "@/components/pagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminProducts } from "@/lib/actions/product.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

type Params = Promise<{ lang: string }>;
type SearchParams = Promise<{ page?: string }>;

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
  return { title: dictionary.metadata.admin_products };
}

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  const { page: pageParam } = await searchParams;
  const language = asLocale(lang);
  const dictionary = await getDictionary(language);
  const text = dictionary.products_text;
  const page = Math.max(1, Number(pageParam) || 1);
  const { data: products, totalPages } = await getAdminProducts(page);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
        <Button asChild>
          <Link href={`/${language}/admin/products/create`}>
            {dictionary.button_text.create_product}
          </Link>
        </Button>
      </div>
      {products.length === 0 ? (
        <p className="text-muted-foreground">
          {language === "en" ? "No products." : "Brak produktów."}
        </p>
      ) : (
        <>
          <Table className="min-w-[48rem]">
            <TableHeader>
              <TableRow>
                <TableHead>{text.name}</TableHead>
                <TableHead className="text-right">{text.price}</TableHead>
                <TableHead>{text.category_text}</TableHead>
                <TableHead>{text.stock}</TableHead>
                <TableHead>{text.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/${language}/admin/products/${product.id}`}
                        >
                          {dictionary.button_text.edit}
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/${language}/product/${product.slug}`}>
                          {language === "en" ? "View" : "Zobacz"}
                        </Link>
                      </Button>
                      <DeleteProductButton
                        productId={product.id}
                        lang={language}
                        dictionary={dictionary}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefForPage={(p) => `/${language}/admin/products?page=${p}`}
            previousLabel={dictionary.pagination_text.previous}
            nextLabel={dictionary.pagination_text.next}
          />
        </>
      )}
    </section>
  );
}
