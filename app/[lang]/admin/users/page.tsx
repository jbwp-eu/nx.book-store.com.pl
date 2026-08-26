import type { Metadata } from "next";
import Link from "next/link";
import DeleteUserButton from "@/components/delete-user-button";
import Pagination from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { getAdminUsers } from "@/lib/actions/user.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

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
  return { title: dictionary.metadata.admin_users };
}

export default async function AdminUsersPage({
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
  const text = dictionary.users_text;
  const session = await auth();
  const page = Math.max(1, Number(pageParam) || 1);
  const { data: users, totalPages } = await getAdminUsers(page);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
      {users.length === 0 ? (
        <p className="text-muted-foreground">
          {language === "en" ? "No users." : "Brak użytkowników."}
        </p>
      ) : (
        <>
          <Table className="min-w-[40rem]">
            <TableHeader>
              <TableRow>
                <TableHead>{text.id}</TableHead>
                <TableHead>{text.name}</TableHead>
                <TableHead>{text.email}</TableHead>
                <TableHead>{text.role}</TableHead>
                <TableHead>{text.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">
                    {user.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge variant="default">{text.admin}</Badge>
                    ) : (
                      <Badge variant="secondary">{text.user}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/${language}/admin/users/${user.id}`}>
                          {dictionary.button_text.edit}
                        </Link>
                      </Button>
                      <DeleteUserButton
                        userId={user.id}
                        lang={language}
                        dictionary={dictionary}
                        disabled={session?.user?.id === user.id}
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
            hrefForPage={(p) => `/${language}/admin/users?page=${p}`}
            previousLabel={dictionary.pagination_text.previous}
            nextLabel={dictionary.pagination_text.next}
          />
        </>
      )}
    </section>
  );
}
