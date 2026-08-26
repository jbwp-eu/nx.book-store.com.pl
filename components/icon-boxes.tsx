import { DollarSign, ShoppingBag, WalletCards } from "lucide-react";
import EmailDialog from "@/components/email-dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export default function IconBoxes({
  lang,
  dictionary,
}: {
  lang: Locale;
  dictionary: Dictionary;
}) {
  const icon = dictionary.icon_boxes_text;
  const contact = dictionary.form_contact_text;

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 md:grid-cols-4">
        <div className="space-y-2">
          <ShoppingBag />
          <div className="text-sm font-bold">{icon.shopping_bag_title}</div>
          <div className="text-muted-foreground text-sm">
            {icon.shopping_bag_description}
          </div>
        </div>
        <div className="space-y-2">
          <DollarSign />
          <div className="text-sm font-bold">{icon.money_back_title}</div>
          <div className="text-muted-foreground text-sm">
            {icon.money_back_description}
          </div>
        </div>
        <div className="space-y-2">
          <WalletCards />
          <div className="text-sm font-bold">{icon.payment_title}</div>
          <div className="text-muted-foreground text-sm">
            {icon.payment_description}
          </div>
        </div>
        <div className="space-y-2">
          <EmailDialog dictionary={dictionary} lang={lang} />
          <div className="space-y-2 text-sm font-bold">{contact.title}</div>
        </div>
      </CardContent>
    </Card>
  );
}
