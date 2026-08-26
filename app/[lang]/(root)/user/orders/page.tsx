import type { Metadata } from "next";
import Link from "next/link";
import Pagination from "@/components/pagination";
import { getMyOrders } from "@/lib/actions/order.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { requireUser } from "@/lib/require-user";

type Params = Promise<{ lang: string }>;
type SearchParams = Promise<{ page?: string }>;

function asLocale(lang: string): Locale {
  return locales.includes(lang as Locale) ? (lang as Locale) : defaultLocale;
}

function formatDate(value: Date, lang: Locale) {
  return value.toLocaleString(lang === "pl" ? "pl-PL" : "en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(asLocale(lang));
  return { title: dictionary.metadata.my_orders };
}

export default async function MyOrdersPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  const { page: pageParam } = await searchParams;
  const language = asLocale(lang);
  await requireUser(language, "/user/orders");
  const dictionary = await getDictionary(language);
  const text = dictionary.orders_text;
  const page = Math.max(1, Number(pageParam) || 1);
  const { data: orders, totalPages } = await getMyOrders(page);

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
      {orders.length === 0 ? (
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {language === "en" ? "No orders yet." : "Brak zamówień."}{" "}
          <Link href={`/${language}`} className="underline">
            {dictionary.cart_text.go}
          </Link>
        </p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2 pr-4 font-medium">{text.id}</th>
                  <th className="py-2 pr-4 font-medium">{text.date}</th>
                  <th className="py-2 pr-4 font-medium">{text.total}</th>
                  <th className="py-2 pr-4 font-medium">{text.paid}</th>
                  <th className="py-2 pr-4 font-medium">{text.delivered}</th>
                  <th className="py-2 font-medium">{text.actions}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-100 dark:border-zinc-900"
                  >
                    <td className="py-3 pr-4 font-mono text-xs">
                      {order.id.slice(0, 8)}
                    </td>
                    <td className="py-3 pr-4">
                      {formatDate(order.createdAt, language)}
                    </td>
                    <td className="py-3 pr-4">{order.totalPrice} zł</td>
                    <td className="py-3 pr-4">
                      {order.isPaid && order.paidAt
                        ? formatDate(order.paidAt, language)
                        : text.not_paid}
                    </td>
                    <td className="py-3 pr-4">
                      {order.isDelivered && order.deliveredAt
                        ? formatDate(order.deliveredAt, language)
                        : text.not_delivered}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/${language}/order/${order.id}`}
                        className="underline"
                      >
                        {text.details}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefForPage={(p) => `/${language}/user/orders?page=${p}`}
            previousLabel={dictionary.pagination_text.previous}
            nextLabel={dictionary.pagination_text.next}
          />
        </>
      )}
    </section>
  );
}
