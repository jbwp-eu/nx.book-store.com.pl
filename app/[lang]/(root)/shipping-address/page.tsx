import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutSteps from "@/components/checkout-steps";
import ShippingAddressForm from "@/components/shipping-address-form";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { requireUser } from "@/lib/require-user";
import type { ShippingAddress } from "@/lib/shipping";

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
  return { title: dictionary.metadata.shipping_address };
}

export default async function ShippingAddressPage({
  params,
}: {
  params: Params;
}) {
  const { lang } = await params;
  const language = asLocale(lang);
  const session = await requireUser(language, "/shipping-address");
  const cart = await getMyCart();
  if (!cart || cart.items.length === 0) redirect(`/${language}/cart`);

  const user = await getUserById(session.user.id);
  const dictionary = await getDictionary(language);

  return (
    <section>
      <CheckoutSteps current={1} labels={dictionary.checkout_steps_text} />
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.shipping_form_text.title}
      </h1>
      <ShippingAddressForm
        lang={language}
        dictionary={dictionary}
        address={(user?.address as ShippingAddress | null) ?? null}
      />
    </section>
  );
}
