export type ShippingAddress = {
  fullName: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
};

export const PAYMENT_METHODS = ["PayPal", "Stripe"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function parseShippingAddress(data: FormData): ShippingAddress {
  return {
    fullName: String(data.get("fullName") ?? "").trim(),
    streetAddress: String(data.get("streetAddress") ?? "").trim(),
    city: String(data.get("city") ?? "").trim(),
    postalCode: String(data.get("postalCode") ?? "").trim(),
    country: String(data.get("country") ?? "").trim(),
  };
}

export function formatShippingAddress(address: ShippingAddress) {
  return [
    address.fullName,
    address.streetAddress,
    `${address.postalCode} ${address.city}`,
    address.country,
  ].join(", ");
}
