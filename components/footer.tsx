import IconBoxes from "@/components/icon-boxes";
import { APP_NAME } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export default function Footer({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-auto">
      <div className="wrapper pb-8">
        <IconBoxes lang={lang} dictionary={dictionary} />
      </div>
      <footer className="border-t">
        <div className="flex-center p-5">
          {currentYear}
          {APP_NAME}. All Rights Reserved
        </div>
      </footer>
    </div>
  );
}
