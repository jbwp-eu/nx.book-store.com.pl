import type { Metadata } from "next";
import Link from "next/link";
import { BadgeDollarSign, Barcode, CreditCard, Users } from "lucide-react";
import AdminOverviewCharts from "@/components/admin-overview-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminOverview } from "@/lib/actions/order.actions";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

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
  return { title: dictionary.metadata.admin_dashboard };
}

export default async function AdminOverviewPage({
  params,
}: {
  params: Params;
}) {
  const { lang } = await params;
  const language = asLocale(lang);
  const dictionary = await getDictionary(language);
  const text = dictionary.dashboard_text;
  const data = await getAdminOverview();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {text.total_revenue}
            </CardTitle>
            <BadgeDollarSign className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.revenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{text.sales}</CardTitle>
            <CreditCard className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data.orders)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {text.customers}
            </CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.users)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {text.products}
            </CardTitle>
            <Barcode className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data.products)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>{text.overview}</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminOverviewCharts
              salesData={data.salesData}
              xAxisLabel={text.sales}
            />
          </CardContent>
        </Card>

        <Card className="px-2 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>{text.recent_sales}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {language === "en" ? "No orders yet." : "Brak zamówień."}
              </p>
            ) : (
              <>
                {data.recent.map((order) => (
                  <Card key={order.id} className="mb-2 sm:hidden">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead>{text.buyer}</TableHead>
                          <TableCell>
                            {order.userName ?? text.deleted_user}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{text.date}</TableHead>
                          <TableCell>
                            {formatDateTime(order.createdAt).dateOnly}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{text.total}</TableHead>
                          <TableCell>
                            {formatCurrency(order.totalPrice)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>{text.actions}</TableHead>
                          <TableCell>
                            <Button asChild variant="link" size="sm" className="h-auto p-0">
                              <Link href={`/${language}/order/${order.id}`}>
                                {text.details}
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                ))}

                <Table className="hidden sm:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{text.buyer}</TableHead>
                      <TableHead>{text.date}</TableHead>
                      <TableHead>{text.total}</TableHead>
                      <TableHead>{text.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {order.userName ?? text.deleted_user}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(order.createdAt).dateOnly}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(order.totalPrice)}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="link" size="sm" className="h-auto p-0">
                            <Link href={`/${language}/order/${order.id}`}>
                              {text.details}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
