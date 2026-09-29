/** Copperline Atelier schema: shared storefront, order, coupon, and inbox vocabulary. */
export type OrderStatus = "placed" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
export type NotificationAudience = "admin" | "customer";

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  hue: "copper" | "brass" | "ink" | "cream";
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  compareAt?: number;
  categoryId: string;
  badge?: string;
  image: string;
  gallery: string[];
  description: string;
  features: string[];
  stock: number;
  colors: string[];
  sizes: string[];
  variantImages?: VariantImage[];
  featured?: boolean;
  deal?: boolean;
  published?: boolean;
}

export interface CartLine {
  productId: string;
  quantity: number;
  color: string;
  size: string;
}

/** An image tied to a specific color, a specific size, or a specific color+size pair. Leave color/size unset to match any value for that axis. */
export interface VariantImage {
  id: string;
  color?: string;
  size?: string;
  image: string;
}

/** Picks the most specific variant image for a color/size pick: exact color+size, then color-only, then size-only. */
export function resolveVariantImage(variantImages: VariantImage[] | undefined, color: string, size: string): VariantImage | undefined {
  if (!variantImages?.length) return undefined;
  const exact = variantImages.find((entry) => entry.color && entry.size && entry.color === color && entry.size === size);
  if (exact) return exact;
  const colorOnly = variantImages.find((entry) => entry.color && !entry.size && entry.color === color);
  if (colorOnly) return colorOnly;
  return variantImages.find((entry) => entry.size && !entry.color && entry.size === size);
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSpend: number;
  maxDiscount?: number;
  /** Maximum number of redemptions. Leave unset (or 0) for unlimited use. */
  usageLimit?: number | null;
  uses: number;
  expiresAt: string;
  categoryIds?: string[];
  productIds?: string[];
  active: boolean;
}

export interface OrderLine extends CartLine {
  name: string;
  price: number;
  image: string;
}

export type FulfillmentMethod = "delivery" | "pickup";

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  campaignId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address: string;
  fulfillment: FulfillmentMethod;
}

export interface StoreNotification {
  id: string;
  audience: NotificationAudience;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  orderId?: string;
}

export interface ThreadMessage {
  id: string;
  orderId: string;
  sender: "admin" | "customer";
  body: string;
  createdAt: string;
}

export interface StoreState {
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  campaigns: Campaign[];
  cart: CartLine[];
  saveForLater: CartLine[];
  couponCode: string | null;
  orders: Order[];
  notifications: StoreNotification[];
  messages: ThreadMessage[];
}

export interface CouponResult {
  valid: boolean;
  message: string;
  discount: number;
  freeShipping: boolean;
}

export type CampaignType = "percent" | "fixed" | "free_shipping";
export type CampaignTargetType = "all" | "brand" | "categories";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  value: number;
  minSpend: number;
  maxDiscount?: number;
  targetType: CampaignTargetType;
  targetValues: string[];
  startsAt: string;
  endsAt: string;
  enabled: boolean;
  priority: number;
}

export interface CampaignResult {
  campaign: Campaign | null;
  eligibleSubtotal: number;
  discount: number;
  freeShipping: boolean;
}
