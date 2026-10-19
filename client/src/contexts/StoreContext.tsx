/** Copperline Atelier state: Laravel-backed commerce data with a small local cart cache for instant customer interactions. */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { campaigns, coupons, categories, messages, notifications, orders, products } from "@/lib/seed";
import type { Campaign, CampaignResult, CartLine, CartTotals, Category, Coupon, CouponResult, FulfillmentMethod, Order, OrderStatus, Product, ProductPricing, StoreNotification, StoreState, ThreadMessage } from "@/lib/types";
import { campaignFor, cartTotalsFor, couponFor, productPricingFor } from "@/lib/pricing";
import { laravelRequest, useAuth } from "@/contexts/AuthContext";

const STORE_KEY = "our-kitchen-copperline-v1";
const NOTIFICATION_POLLING_INTERVAL_MS = 30_000;
// The catalogue (products, collections, coupons, campaigns) always comes from the API; the seed is only used to populate an empty backend.
const freshState = (): StoreState => ({ products: [], categories: [], coupons: [], campaigns: [], cart: [], saveForLater: [], couponCode: null, orders, notifications, messages });
type StoreActivity = Pick<StoreState, "orders" | "notifications" | "messages">;

type StoreContextValue = {
  state: StoreState;
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, color: string, size?: string, quantity?: number) => void;
  updateQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  saveForLater: (productId: string, color: string, size: string) => void;
  moveToCart: (productId: string, color: string, size: string) => void;
  removeFromSaved: (productId: string, color: string, size: string) => void;
  setCouponCode: (code: string | null) => void;
  validateCoupon: (code: string | null, lines?: CartLine[]) => CouponResult;
  campaignResult: (lines?: CartLine[]) => CampaignResult;
  cartTotals: (fulfillment?: FulfillmentMethod) => CartTotals;
  productPricing: (product: Product) => ProductPricing;
  placeOrder: (details: Pick<Order, "customerName" | "customerEmail" | "address" | "fulfillment">) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  sendMessage: (orderId: string, sender: "admin" | "customer", body: string) => void;
  markNotificationsRead: (audience: "admin" | "customer") => void;
  upsertProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  upsertCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  upsertCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  upsertCampaign: (campaign: Campaign) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const api = async <T,>(path: string, method = "GET", body?: unknown): Promise<T | null> => {
  try { return await laravelRequest<T>(path, method, body); } catch (error) {
    console.warn("[Our Kitchen API]", error);
    return null;
  }
};
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<StoreState>(() => { try { const saved = localStorage.getItem(STORE_KEY); if (!saved) return freshState(); const { products: _p, categories: _c, coupons: _k, campaigns: _m, ...cached } = JSON.parse(saved); return { ...freshState(), ...cached }; } catch { return freshState(); } });
  const cartId = user ? `cart-${user.id}` : null;
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
      const remoteCart = cartId ? await api<{ cart: CartLine[]; saveForLater: CartLine[]; couponCode: string | null }>(`/carts/${cartId}`) : null;
      if (!active || !remote) return;
      setState((current) => ({ ...freshState(), ...remote, cart: remoteCart?.cart?.length ? remoteCart.cart : current.cart, saveForLater: remoteCart?.saveForLater?.length ? remoteCart.saveForLater : current.saveForLater, couponCode: remoteCart?.couponCode ?? current.couponCode }));
      setHydrated(true);
    };
    void load(); return () => { active = false; };
  }, [cartId]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    let refreshing = false;
    const refreshActivity = async () => {
      if (!active || refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const activity = await api<StoreActivity>("/store/activity");
        if (active && activity) setState((current) => ({ ...current, ...activity }));
      } finally {
        refreshing = false;
      }
    };
    const interval = window.setInterval(() => { void refreshActivity(); }, NOTIFICATION_POLLING_INTERVAL_MS);
    const refreshOnReturn = () => { if (document.visibilityState === "visible") void refreshActivity(); };
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [user?.id]);
  useEffect(() => { if (hydrated && cartId) void api(`/carts/${cartId}`, "PUT", { cart: state.cart, saveForLater: state.saveForLater, couponCode: state.couponCode }); }, [cartId, hydrated, state.cart, state.saveForLater, state.couponCode]);

  const cartSubtotal = useMemo(() => state.cart.reduce((sum, line) => sum + (state.products.find((item) => item.id === line.productId)?.price ?? 0) * line.quantity, 0), [state.cart, state.products]);
  const catalog = { products: state.products, campaigns: state.campaigns, coupons: state.coupons };
  // Pricing rules live in @/lib/pricing so the cart, checkout, product cards and tests share them; StoreApiController mirrors them.
  const validateCoupon = (code: string | null, lines = state.cart): CouponResult => couponFor(code, lines, catalog);
  const campaignResult = (lines = state.cart): CampaignResult => campaignFor(lines, catalog);
  const cartTotals = (fulfillment: FulfillmentMethod = "delivery"): CartTotals => cartTotalsFor(state.cart, state.couponCode, catalog, fulfillment);
  const productPricing = (product: Product): ProductPricing => productPricingFor(product, state.campaigns);

  const value: StoreContextValue = {
    state, cartCount: state.cart.reduce((sum, line) => sum + line.quantity, 0), cartSubtotal, validateCoupon, campaignResult, cartTotals, productPricing,
    addToCart: (productId, color, size = "", quantity = 1) => setState((current) => { const existing = current.cart.find((line) => line.productId === productId && line.color === color && line.size === size); return { ...current, cart: existing ? current.cart.map((line) => line === existing ? { ...line, quantity: line.quantity + quantity } : line) : [...current.cart, { productId, color, size, quantity }] }; }),
    updateQuantity: (productId, color, size, quantity) => setState((current) => ({ ...current, cart: quantity <= 0 ? current.cart.filter((line) => line.productId !== productId || line.color !== color || line.size !== size) : current.cart.map((line) => line.productId === productId && line.color === color && line.size === size ? { ...line, quantity } : line) })),
    removeFromCart: (productId, color, size) => setState((current) => ({ ...current, cart: current.cart.filter((line) => line.productId !== productId || line.color !== color || line.size !== size) })),
    saveForLater: (productId, color, size) => setState((current) => {
      const line = current.cart.find((l) => l.productId === productId && l.color === color && l.size === size);
      if (!line) return current;
      return {
        ...current,
        cart: current.cart.filter((l) => !(l.productId === productId && l.color === color && l.size === size)),
        saveForLater: [...current.saveForLater.filter((l) => !(l.productId === productId && l.color === color && l.size === size)), line]
      };
    }),
    moveToCart: (productId, color, size) => setState((current) => {
      const line = current.saveForLater.find((l) => l.productId === productId && l.color === color && l.size === size);
      if (!line) return current;
      return {
        ...current,
        saveForLater: current.saveForLater.filter((l) => !(l.productId === productId && l.color === color && l.size === size)),
        cart: [...current.cart.filter((l) => !(l.productId === productId && l.color === color && l.size === size)), line]
      };
    }),
    removeFromSaved: (productId, color, size) => setState((current) => ({ ...current, saveForLater: current.saveForLater.filter((line) => line.productId !== productId || line.color !== color || line.size !== size) })),
    setCouponCode: (couponCode) => setState((current) => ({ ...current, couponCode })),
    placeOrder: async (details) => {
      if (!user || !state.cart.length) return null;
      const { coupon: couponResult, campaign: activeCampaign, discount, shipping, total } = cartTotals(details.fulfillment); const id = `CK-${String(Date.now()).slice(-6)}`;
      const order: Order & { campaignId?: string } = { id, createdAt: new Date().toISOString(), status: "placed", lines: state.cart.map((line) => { const product = state.products.find((item) => item.id === line.productId)!; return { ...line, name: product.name, price: product.price, image: product.image }; }), subtotal: cartSubtotal, discount, shipping, total, couponCode: couponResult.valid ? state.couponCode ?? undefined : undefined, campaignId: activeCampaign.campaign?.id, ...details };
      const confirmed = await laravelRequest<Order>("/orders", "POST", { order });
      setState((current) => ({ ...current, orders: [confirmed, ...current.orders.filter((existing) => existing.id !== confirmed.id)], cart: [], couponCode: null }));
      return confirmed;
    },
    updateOrderStatus: (orderId, status) => { setState((current) => ({ ...current, orders: current.orders.map((order) => order.id === orderId ? { ...order, status } : order) })); void api(`/orders/${orderId}/status`, "PATCH", { status }); },
    sendMessage: (orderId, sender, body) => { const message: ThreadMessage = { id: `msg-${Date.now()}`, orderId, sender, body, createdAt: new Date().toISOString() }; setState((current) => ({ ...current, messages: [...current.messages, message] })); void api(`/orders/${orderId}/messages`, "POST", { sender, body }); },
    markNotificationsRead: (audience) => { setState((current) => ({ ...current, notifications: current.notifications.map((note) => note.audience === audience ? { ...note, read: true } : note) })); void api("/notifications/read", "POST", { audience }); },
    upsertProduct: (product) => { setState((current) => ({ ...current, products: current.products.some((item) => item.id === product.id) ? current.products.map((item) => item.id === product.id ? product : item) : [product, ...current.products] })); void api(`/products/${product.id}`, "PUT", product); },
    deleteProduct: (id) => { setState((current) => ({ ...current, products: current.products.filter((product) => product.id !== id), cart: current.cart.filter((line) => line.productId !== id) })); void api(`/products/${id}`, "DELETE"); },
    upsertCategory: (category) => { setState((current) => ({ ...current, categories: current.categories.some((item) => item.id === category.id) ? current.categories.map((item) => item.id === category.id ? category : item) : [category, ...current.categories] })); void api(`/categories/${category.id}`, "PUT", category); },
    deleteCategory: (id) => { setState((current) => ({ ...current, categories: current.categories.filter((cat) => cat.id !== id) })); void api(`/categories/${id}`, "DELETE"); },
    upsertCoupon: (coupon) => { setState((current) => ({ ...current, coupons: current.coupons.some((item) => item.id === coupon.id) ? current.coupons.map((item) => item.id === coupon.id ? coupon : item) : [coupon, ...current.coupons] })); void api(`/coupons/${coupon.id}`, "PUT", coupon); },
    deleteCoupon: (id) => { setState((current) => ({ ...current, coupons: current.coupons.filter((coupon) => coupon.id !== id) })); void api(`/coupons/${id}`, "DELETE"); },
    upsertCampaign: async (campaign) => { const confirmed = await laravelRequest<Campaign>(`/campaigns/${campaign.id}`, "PUT", campaign); setState((current) => ({ ...current, campaigns: current.campaigns.some((item) => item.id === campaign.id) ? current.campaigns.map((item) => item.id === campaign.id ? confirmed : item) : [confirmed, ...current.campaigns] })); },
    deleteCampaign: async (id) => { const confirmed = await laravelRequest<{ success: boolean }>(`/campaigns/${id}`, "DELETE"); if (!confirmed.success) throw new Error("Campaign could not be removed."); setState((current) => ({ ...current, campaigns: current.campaigns.filter((campaign) => campaign.id !== id) })); },
    clearCart: () => setState((current) => ({ ...current, cart: [], couponCode: null })),
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() { const context = useContext(StoreContext); if (!context) throw new Error("useStore must be used inside StoreProvider"); return context; }
