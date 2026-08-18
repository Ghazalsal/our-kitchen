/** Copperline Atelier state: Laravel-backed commerce data with a small local cart cache for instant customer interactions. */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { coupons, categories, messages, notifications, orders, products } from "@/lib/seed";
import type { CartLine, Coupon, CouponResult, Order, OrderStatus, Product, StoreNotification, StoreState, ThreadMessage } from "@/lib/types";

const STORE_KEY = "our-kitchen-copperline-v1";
const CART_KEY = "our-kitchen-laravel-cart-id";
const ADMIN_TOKEN_KEY = "our-kitchen-laravel-admin-token";
const freshState = (): StoreState => ({ products, categories, coupons, cart: [], couponCode: null, orders, notifications, messages });

type StoreContextValue = {
  state: StoreState;
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, color: string, quantity?: number) => void;
  updateQuantity: (productId: string, color: string, quantity: number) => void;
  removeFromCart: (productId: string, color: string) => void;
  setCouponCode: (code: string | null) => void;
  validateCoupon: (code: string | null, lines?: CartLine[]) => CouponResult;
  placeOrder: (details: Pick<Order, "customerName" | "customerEmail" | "address">) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  sendMessage: (orderId: string, sender: "admin" | "customer", body: string) => void;
  markNotificationsRead: (audience: "admin" | "customer") => void;
  upsertProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  upsertCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const money = (value: number) => Math.round(value * 100) / 100;
const api = async <T,>(path: string, method = "GET", body?: unknown): Promise<T | null> => {
  try {
    const headers: Record<string, string> = body ? { "Content-Type": "application/json" } : {};
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (adminToken) headers["X-Copperline-Admin"] = adminToken;
    const response = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error(`${method} ${path} failed (${response.status})`);
    return await response.json() as T;
  } catch (error) {
    console.warn("[Our Kitchen API]", error);
    return null;
  }
};
const getCartId = () => {
  const existing = localStorage.getItem(CART_KEY);
  if (existing) return existing;
  const created = `cart-${crypto.randomUUID()}`;
  localStorage.setItem(CART_KEY, created);
  return created;
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(() => { try { const saved = localStorage.getItem(STORE_KEY); return saved ? { ...freshState(), ...JSON.parse(saved) } : freshState(); } catch { return freshState(); } });
  const [cartId] = useState(getCartId);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key !== STORE_KEY || !event.newValue) return; try { setState({ ...freshState(), ...JSON.parse(event.newValue) }); } catch { /* preserve active state */ } };
    window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      let remote = await api<Omit<StoreState, "cart" | "couponCode">>("/store/bootstrap");
      if (remote && remote.products.length === 0) remote = await api<Omit<StoreState, "cart" | "couponCode">>("/catalog/sync", "POST", { products, categories, coupons });
      const remoteCart = await api<{ cart: CartLine[]; couponCode: string | null }>(`/carts/${cartId}`);
      if (!active || !remote) return;
      setState((current) => ({ ...freshState(), ...remote, cart: remoteCart?.cart?.length ? remoteCart.cart : current.cart, couponCode: remoteCart?.couponCode ?? current.couponCode }));
      setHydrated(true);
    };
    void load(); return () => { active = false; };
  }, [cartId]);
  useEffect(() => { if (hydrated) void api(`/carts/${cartId}`, "PUT", { cart: state.cart, couponCode: state.couponCode }); }, [cartId, hydrated, state.cart, state.couponCode]);

  const cartSubtotal = useMemo(() => state.cart.reduce((sum, line) => sum + (state.products.find((item) => item.id === line.productId)?.price ?? 0) * line.quantity, 0), [state.cart, state.products]);
  const validateCoupon = (code: string | null, lines = state.cart): CouponResult => {
    if (!code) return { valid: true, message: "No coupon applied.", discount: 0, freeShipping: false };
    const coupon = state.coupons.find((item) => item.code.toLowerCase() === code.toLowerCase());
    const subtotal = lines.reduce((sum, line) => sum + (state.products.find((item) => item.id === line.productId)?.price ?? 0) * line.quantity, 0);
    if (!coupon || !coupon.active) return { valid: false, message: "That kitchen code is not active.", discount: 0, freeShipping: false };
    if (new Date(coupon.expiresAt) < new Date()) return { valid: false, message: "That kitchen code has expired.", discount: 0, freeShipping: false };
    if (coupon.uses >= coupon.usageLimit) return { valid: false, message: "That kitchen code has reached its limit.", discount: 0, freeShipping: false };
    if (subtotal < coupon.minSpend) return { valid: false, message: `Add $${coupon.minSpend - subtotal} more to use this code.`, discount: 0, freeShipping: false };
    if (coupon.categoryIds?.length && lines.some((line) => !coupon.categoryIds?.includes(state.products.find((item) => item.id === line.productId)?.categoryId ?? ""))) return { valid: false, message: "This code is reserved for a different kitchen collection.", discount: 0, freeShipping: false };
    const discount = coupon.type === "percent" ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount ?? Infinity) : coupon.type === "fixed" ? coupon.value : 0;
    return { valid: true, message: coupon.type === "free_shipping" ? "Delivery is on us." : "Copper saved for this order.", discount: money(discount), freeShipping: coupon.type === "free_shipping" };
  };

  const value: StoreContextValue = {
    state, cartCount: state.cart.reduce((sum, line) => sum + line.quantity, 0), cartSubtotal, validateCoupon,
    addToCart: (productId, color, quantity = 1) => setState((current) => { const existing = current.cart.find((line) => line.productId === productId && line.color === color); return { ...current, cart: existing ? current.cart.map((line) => line === existing ? { ...line, quantity: line.quantity + quantity } : line) : [...current.cart, { productId, color, quantity }] }; }),
    updateQuantity: (productId, color, quantity) => setState((current) => ({ ...current, cart: quantity <= 0 ? current.cart.filter((line) => line.productId !== productId || line.color !== color) : current.cart.map((line) => line.productId === productId && line.color === color ? { ...line, quantity } : line) })),
    removeFromCart: (productId, color) => setState((current) => ({ ...current, cart: current.cart.filter((line) => line.productId !== productId || line.color !== color) })),
    setCouponCode: (couponCode) => setState((current) => ({ ...current, couponCode })),
    placeOrder: (details) => {
      if (!state.cart.length) return null;
      const couponResult = validateCoupon(state.couponCode); const shipping = couponResult.freeShipping || cartSubtotal >= 300 ? 0 : 18; const id = `CK-${String(Date.now()).slice(-6)}`;
      const order: Order = { id, createdAt: new Date().toISOString(), status: "placed", lines: state.cart.map((line) => { const product = state.products.find((item) => item.id === line.productId)!; return { ...line, name: product.name, price: product.price, image: product.image }; }), subtotal: cartSubtotal, discount: couponResult.valid ? couponResult.discount : 0, shipping, total: money(cartSubtotal - (couponResult.valid ? couponResult.discount : 0) + shipping), couponCode: couponResult.valid ? state.couponCode ?? undefined : undefined, ...details };
      setState((current) => ({ ...current, orders: [order, ...current.orders], cart: [], couponCode: null, coupons: couponResult.valid && current.couponCode ? current.coupons.map((coupon) => coupon.code.toLowerCase() === current.couponCode?.toLowerCase() ? { ...coupon, uses: coupon.uses + 1 } : coupon) : current.coupons, notifications: [{ id: `note-${Date.now()}`, audience: "admin", title: "A fresh order is on the counter", body: `${id} has been placed for $${order.total.toFixed(2)}.`, createdAt: order.createdAt, read: false, orderId: id }, ...current.notifications] }));
      void api("/orders", "POST", { order }); return order;
    },
    updateOrderStatus: (orderId, status) => { setState((current) => ({ ...current, orders: current.orders.map((order) => order.id === orderId ? { ...order, status } : order), notifications: [{ id: `note-${Date.now()}`, audience: "customer", title: "Your order has moved", body: `${orderId} is now ${status}.`, createdAt: new Date().toISOString(), read: false, orderId }, ...current.notifications] })); void api(`/orders/${orderId}/status`, "PATCH", { status }); },
    sendMessage: (orderId, sender, body) => { const message: ThreadMessage = { id: `msg-${Date.now()}`, orderId, sender, body, createdAt: new Date().toISOString() }; setState((current) => ({ ...current, messages: [...current.messages, message], notifications: [{ id: `note-${Date.now() + 1}`, audience: sender === "customer" ? "admin" : "customer", title: sender === "customer" ? "New order question" : "A note from the kitchen", body: body.slice(0, 72), createdAt: message.createdAt, read: false, orderId }, ...current.notifications] })); void api(`/orders/${orderId}/messages`, "POST", { sender, body }); },
    markNotificationsRead: (audience) => { setState((current) => ({ ...current, notifications: current.notifications.map((note) => note.audience === audience ? { ...note, read: true } : note) })); void api("/notifications/read", "POST", { audience }); },
    upsertProduct: (product) => { setState((current) => ({ ...current, products: current.products.some((item) => item.id === product.id) ? current.products.map((item) => item.id === product.id ? product : item) : [product, ...current.products] })); void api(`/products/${product.id}`, "PUT", product); },
    deleteProduct: (id) => { setState((current) => ({ ...current, products: current.products.filter((product) => product.id !== id), cart: current.cart.filter((line) => line.productId !== id) })); void api(`/products/${id}`, "DELETE"); },
    upsertCoupon: (coupon) => { setState((current) => ({ ...current, coupons: current.coupons.some((item) => item.id === coupon.id) ? current.coupons.map((item) => item.id === coupon.id ? coupon : item) : [coupon, ...current.coupons] })); void api(`/coupons/${coupon.id}`, "PUT", coupon); },
    deleteCoupon: (id) => { setState((current) => ({ ...current, coupons: current.coupons.filter((coupon) => coupon.id !== id) })); void api(`/coupons/${id}`, "DELETE"); },
    clearCart: () => setState((current) => ({ ...current, cart: [], couponCode: null })),
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() { const context = useContext(StoreContext); if (!context) throw new Error("useStore must be used inside StoreProvider"); return context; }
