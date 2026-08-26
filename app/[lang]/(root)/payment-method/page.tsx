import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutSteps from "@/components/checkout-steps";
import PaymentMethodForm from "@/components/payment-method-form";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { requireUser } from "@/lib/require-user";

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
  return { title: dictionary.metadata.select_payment_method };
}

export default async function PaymentMethodPage({
  params,
}: {
  params: Params;
}) {
  const { lang } = await params;
  const language = asLocale(lang);
  const session = await requireUser(language, "/payment-method");
  const cart = await getMyCart();
  if (!cart || cart.items.length === 0) redirect(`/${language}/cart`);

  const user = await getUserById(session.user.id);
  if (!user?.address) redirect(`/${language}/shipping-address`);

  const dictionary = await getDictionary(language);

  return (
    <section>
      <CheckoutSteps current={2} labels={dictionary.checkout_steps_text} />
      <h1 className="text-2xl font-semibold tracking-tight">
        {dictionary.payment_method_text.title}
      </h1>
      <PaymentMethodForm
        lang={language}
        dictionary={dictionary}
        current={user.paymentMethod}
      />
    </section>
  );
}
