import { Button } from "@/components/ui/button";
import { signOutUser } from "@/lib/actions/user.actions";
import type { Locale } from "@/lib/i18n";

export default function SignOutButton({
  lang,
  label,
}: {
  lang: Locale;
  label: string;
}) {
  return (
    <form action={signOutUser.bind(null, lang)}>
      <Button type="submit" variant="ghost" size="sm">
        {label}
      </Button>
    </form>
  );
}
