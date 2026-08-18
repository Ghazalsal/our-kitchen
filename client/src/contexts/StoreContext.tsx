/** Copperline Atelier state: browser-persistent commerce behaviour with local cross-tab synchronization. */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { coupons, categories, messages, notifications, orders, products } from "@/lib/seed";
import type { CartLine, Coupon, CouponResult, Order, OrderStatus, Product, StoreNotification, StoreState, ThreadMessage } from "@/lib/types";

const STORE_KEY = "our-kitchen-copperline-v1";
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
const formatStatus = (status: OrderStatus) => status === "placed" ? "placed" : status;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      return saved ? { ...freshState(), ...JSON.parse(saved) } : freshState();
    } catch { return freshState(); }
  });

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORE_KEY || !event.newValue) return;
      try { setState({ ...freshState(), ...JSON.parse(event.newValue) }); } catch { /* preserve active state */ }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const cartSubtotal = useMemo(() => state.cart.reduce((sum, line) => {
    const product = state.products.find((item) => item.id === line.productId);
    return sum + (product ? product.price * line.quantity : 0);
  }, 0), [state.cart, state.products]);

  const validateCoupon = (code: string | null, lines = state.cart): CouponResult => {
    if (!code) return { valid: true, message: "No coupon applied.", discount: 0, freeShipping: false };
    const coupon = state.coupons.find((item) => item.code.toLowerCase() === code.toLowerCase());
    const subtotal = lines.reduce((sum, line) => sum + (state.products.find((item) => item.id === line.productId)?.price ?? 0) * line.quantity, 0);
    if (!coupon || !coupon.active) return { valid: false, message: "That kitchen code is not active.", discount: 0, freeShipping: false };
    if (new Date(coupon.expiresAt) < new Date()) return { valid: false, message: "That kitchen code has expired.", discount: 0, freeShipping: false };
    if (coupon.uses >= coupon.usageLimit) return { valid: false, message: "That kitchen code has reached its limit.", discount: 0, freeShipping: false };
    if (subtotal < coupon.minSpend) return { valid: false, message: `Add $${coupon.minSpend - subtotal} more to use this code.`, discount: 0, freeShipping: false };
    if (coupon.categoryIds?.length && lines.some((line) => !coupon.categoryIds?.includes(state.products.find((item) => item.id === line.productId)?.categoryId ?? ""))) {
      return { valid: false, message: "This code is reserved for a different kitchen collection.", discount: 0, freeShipping: false };
    }
    const discount = coupon.type === "percent" ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount ?? Infinity) : coupon.type === "fixed" ? coupon.value : 0;
    return { valid: true, message: coupon.type === "free_shipping" ? "Delivery is on us." : "Copper saved for this order.", discount: money(discount), freeShipping: coupon.type === "free_shipping" };
  };

  const value: StoreContextValue = {
    state,
    cartCount: state.cart.reduce((sum, line) => sum + line.quantity, 0),
    cartSubtotal,
    addToCart: (productId, color, quantity = 1) => setState((current) => {
      const existing = current.cart.find((line) => line.productId === productId && line.color === color);
      const cart = existing ? current.cart.map((line) => line === existing ? { ...line, quantity: line.quantity + quantity } : line) : [...current.cart, { productId, color, quantity }];
      return { ...current, cart };
    }),
    updateQuantity: (productId, color, quantity) => setState((current) => ({ ...current, cart: quantity <= 0 ? current.cart.filter((line) => line.productId !== productId || line.color !== color) : current.cart.map((line) => line.productId === productId && line.color === color ? { ...line, quantity } : line) })),
    removeFromCart: (productId, color) => setState((current) => ({ ...current, cart: current.cart.filter((line) => line.productId !== productId || line.color !== color) })),
    setCouponCode: (couponCode) => setState((current) => ({ ...current, couponCode })),
    validateCoupon,
    placeOrder: (details) => {
      if (!state.cart.length) return null;
      const couponResult = validateCoupon(state.couponCode);
      const subtotal = cartSubtotal;
      const shipping = couponResult.freeShipping || subtotal >= 300 ? 0 : 18;
      const id = `CK-${String(Date.now()).slice(-6)}`;
      const order: Order = { id, createdAt: new Date().toISOString(), status: "placed", lines: state.cart.map((line) => { const product = state.products.find((item) => item.id === line.productId)!; return { ...line, name: product.name, price: product.price, image: product.image }; }), subtotal, discount: couponResult.valid ? couponResult.discount : 0, shipping, total: money(subtotal - (couponResult.valid ? couponResult.discount : 0) + shipping), couponCode: couponResult.valid ? state.couponCode ?? undefined : undefined, ...details };
      setState((current) => ({ ...current, orders: [order, ...current.orders], cart: [], couponCode: null, coupons: couponResult.valid && current.couponCode ? current.coupons.map((coupon) => coupon.code.toLowerCase() === current.couponCode?.toLowerCase() ? { ...coupon, uses: coupon.uses + 1 } : coupon) : current.coupons, notifications: [{ id: `note-${Date.now()}`, audience: "admin", title: "A fresh order is on the counter", body: `${id} has been placed for $${order.total.toFixed(2)}.`, createdAt: order.createdAt, read: false, orderId: id }, ...current.notifications] }));
      return order;
    },
    updateOrderStatus: (orderId, status) => setState((current) => ({ ...current, orders: current.orders.map((order) => order.id === orderId ? { ...order, status } : order), notifications: [{ id: `note-${Date.now()}`, audience: "customer", title: "Your order has moved", body: `${orderId} is now ${formatStatus(status)}.`, createdAt: new Date().toISOString(), read: false, orderId }, ...current.notifications] })),
    sendMessage: (orderId, sender, body) => {
      const message: ThreadMessage = { id: `msg-${Date.now()}`, orderId, sender, body, createdAt: new Date().toISOString() };
      setState((current) => ({ ...current, messages: [...current.messages, message], notifications: [{ id: `note-${Date.now() + 1}`, audience: sender === "customer" ? "admin" : "customer", title: sender === "customer" ? "New order question" : "A note from the kitchen", body: body.slice(0, 72), createdAt: message.createdAt, read: false, orderId }, ...current.notifications] }));
    },
    markNotificationsRead: (audience) => setState((current) => ({ ...current, notifications: current.notifications.map((note) => note.audience === audience ? { ...note, read: true } : note) })),
    upsertProduct: (product) => setState((current) => ({ ...current, products: current.products.some((item) => item.id === product.id) ? current.products.map((item) => item.id === product.id ? product : item) : [product, ...current.products] })),
    deleteProduct: (id) => setState((current) => ({ ...current, products: current.products.filter((product) => product.id !== id), cart: current.cart.filter((line) => line.productId !== id) })),
    upsertCoupon: (coupon) => setState((current) => ({ ...current, coupons: current.coupons.some((item) => item.id === coupon.id) ? current.coupons.map((item) => item.id === coupon.id ? coupon : item) : [coupon, ...current.coupons] })),
    deleteCoupon: (id) => setState((current) => ({ ...current, coupons: current.coupons.filter((coupon) => coupon.id !== id) })),
    clearCart: () => setState((current) => ({ ...current, cart: [], couponCode: null })),
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
