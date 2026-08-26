import type { Metadata } from "next";
import Link from "next/link";
import DeliverOrderButton from "@/components/deliver-order-button";
import DeleteOrderButton from "@/components/delete-order-button";
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
import { getAllOrdersAdmin } from "@/lib/actions/order.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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
  return { title: dictionary.metadata.admin_orders };
}

export default async function AdminOrdersPage({
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
  const text = dictionary.orders_admin_text;
  const orderText = dictionary.order_text;
  const page = Math.max(1, Number(pageParam) || 1);
  const { data: orders, totalPages } = await getAllOrdersAdmin(page);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">
          {language === "en" ? "No orders yet." : "Brak zamówień."}
        </p>
      ) : (
        <>
          <Table className="min-w-[44rem]">
            <TableHeader>
              <TableRow>
                <TableHead>{text.id}</TableHead>
                <TableHead>{text.date}</TableHead>
                <TableHead>{text.buyer}</TableHead>
                <TableHead>{text.total}</TableHead>
                <TableHead>{text.paid}</TableHead>
                <TableHead>{text.delivered}</TableHead>
                <TableHead>{text.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(order.createdAt).dateTime}
                  </TableCell>
                  <TableCell>{order.userName ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell>
                    {order.isPaid && order.paidAt
                      ? formatDateTime(order.paidAt).dateTime
                      : text.not_paid}
                  </TableCell>
                  <TableCell>
                    {order.isDelivered && order.deliveredAt
                      ? formatDateTime(order.deliveredAt).dateTime
                      : text.not_delivered}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/${language}/order/${order.id}`}>
                          {text.details}
                        </Link>
                      </Button>
                      {order.isPaid && !order.isDelivered ? (
                        <DeliverOrderButton
                          orderId={order.id}
                          lang={language}
                          label={orderText.mark_as_delivered}
                          processingLabel={orderText.processing}
                        />
                      ) : null}
                      <DeleteOrderButton
                        orderId={order.id}
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
            hrefForPage={(p) => `/${language}/admin/orders?page=${p}`}
            previousLabel={dictionary.pagination_text.previous}
            nextLabel={dictionary.pagination_text.next}
          />
        </>
      )}
    </section>
  );
}
