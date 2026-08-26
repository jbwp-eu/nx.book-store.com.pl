import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

export default function ViewAllProductsButton({
  lang,
  label,
}: {
  lang: Locale;
  label: string;
}) {
  return (
    <div className="my-8 flex items-center justify-center">
      <Button asChild className="px-8 py-4 text-lg font-semibold">
        <Link href={`/${lang}/search`}>{label}</Link>
      </Button>
    </div>
  );
}
