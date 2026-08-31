/** Stripe env selection by DEPLOY_TARGET (ovh | azure). */

export type DeployTarget = "ovh" | "azure";

export function getDeployTarget(): DeployTarget {
  const raw =
    process.env.DEPLOY_TARGET ?? process.env.NEXT_PUBLIC_DEPLOY_TARGET;
  return raw === "azure" ? "azure" : "ovh";
}

function stripeEnv(
  base: "STRIPE_SECRET_KEY_TEST_MODE" | "STRIPE_WEBHOOK_SECRET_TEST_MODE",
): string | undefined {
  const suffix = getDeployTarget() === "azure" ? "AZURE" : "OVH";
  const value = process.env[`${base}_${suffix}`];
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed) {
    return trimmed;
  }
  const legacyKey =
    base === "STRIPE_SECRET_KEY_TEST_MODE"
      ? "STRIPE_SECRET_KEY"
      : "STRIPE_WEBHOOK_SECRET";
  const legacy = process.env[legacyKey];
  const legacyTrimmed = typeof legacy === "string" ? legacy.trim() : "";
  return legacyTrimmed || undefined;
}

/** Local `stripe listen` secret; used in dev only. */
export function stripeWebhookSecret(): string | undefined {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== "production" && nodeEnv !== "test") {
    const cli = process.env.STRIPE_WEBHOOK_SECRET_TEST_MODE_CLI?.trim();
    if (cli) {
      return cli;
    }
  }
  return stripeEnv("STRIPE_WEBHOOK_SECRET_TEST_MODE");
}

export function stripeSecretKey(): string | undefined {
  return stripeEnv("STRIPE_SECRET_KEY_TEST_MODE");
}

export function stripePublishableKey(): string | undefined {
  const target = getDeployTarget();
  const byTarget = {
    ovh: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST_MODE_OVH,
    azure: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST_MODE_AZURE,
  } as const;
  const value = byTarget[target];
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed) {
    return trimmed;
  }
  const legacy = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return legacy || undefined;
}

export function isStripeConfigured(): boolean {
  return Boolean(stripeSecretKey() && stripePublishableKey());
}
