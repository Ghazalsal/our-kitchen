export function formatILS(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Orders at or above this subtotal ship free. Keep in sync with StoreApiController::createOrder. */
export const FREE_DELIVERY_THRESHOLD = 500;
