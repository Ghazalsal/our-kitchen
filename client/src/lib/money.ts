export function formatILS(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Customer-facing name of a coupon or campaign offer, shared by the storefront and the atelier desk. */
export function offerLabel(offer: { type: "percent" | "fixed" | "free_shipping"; value: number }): string {
  return offer.type === "percent" ? `${offer.value}% off` : offer.type === "fixed" ? `${formatILS(offer.value)} off` : "Free delivery";
}

/** Admin-side check that an offer's value makes sense for its type; null when it is fine. Free delivery needs no value. */
export function offerValueError(offer: { type: "percent" | "fixed" | "free_shipping"; value: number }): string | null {
  if (offer.type === "free_shipping") return null;
  if (!Number.isFinite(offer.value) || offer.value <= 0) return "Enter a discount greater than zero.";
  if (offer.type === "percent" && offer.value > 100) return "A percent discount cannot exceed 100%.";
  return null;
}

/** Orders at or above this subtotal ship free. Keep in sync with StoreApiController::createOrder. */
export const FREE_DELIVERY_THRESHOLD = 500;
