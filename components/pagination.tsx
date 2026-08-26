import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Pagination({
  page,
  totalPages,
  hrefForPage,
  previousLabel,
  nextLabel,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  previousLabel: string;
  nextLabel: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefForPage(page - 1)}>{previousLabel}</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          {previousLabel}
        </Button>
      )}
      <span className="text-muted-foreground text-sm">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefForPage(page + 1)}>{nextLabel}</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
