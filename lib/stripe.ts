import Stripe from "stripe";
import { stripeSecretKey } from "@/lib/stripe-env";

export function getStripe() {
  const key = stripeSecretKey();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY_TEST_MODE_* is not set");
  }
  return new Stripe(key);
}
