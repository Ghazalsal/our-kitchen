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
  featured?: boolean;
  deal?: boolean;
}

export interface CartLine {
  productId: string;
  quantity: number;
  color: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSpend: number;
  maxDiscount?: number;
  usageLimit: number;
  uses: number;
  expiresAt: string;
  categoryIds?: string[];
  active: boolean;
}

export interface OrderLine extends CartLine {
  name: string;
  price: number;
  image: string;
}

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
  customerName: string;
  customerEmail: string;
  address: string;
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
  cart: CartLine[];
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
