import { NextRequest, NextResponse } from "next/server";
import { updateOrderToPaid } from "@/lib/actions/order.actions";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function asLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale)
    ? (value as Locale)
    : defaultLocale;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json(
      { message: "Webhook secret or signature missing" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  let event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ message }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        await updateOrderToPaid(
          orderId,
          asLocale(paymentIntent.metadata?.lang),
        );
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: event.type });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
