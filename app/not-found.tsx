import { defaultLocale } from "@/lib/i18n";
import NotFoundView from "@/components/not-found-view";

export default function RootNotFound() {
  return <NotFoundView lang={defaultLocale} />;
}
