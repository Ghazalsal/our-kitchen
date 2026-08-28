/** Copperline Atelier state: Laravel-backed commerce data with a small local cart cache for instant customer interactions. */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { campaigns, coupons, categories, messages, notifications, orders, products } from "@/lib/seed";
import type { Campaign, CampaignResult, CartLine, Category, Coupon, CouponResult, Order, OrderStatus, Product, StoreNotification, StoreState, ThreadMessage } from "@/lib/types";
import { formatILS } from "@/lib/money";
import { laravelRequest, useAuth } from "@/contexts/AuthContext";

const STORE_KEY = "our-kitchen-copperline-v1";
const NOTIFICATION_POLLING_INTERVAL_MS = 30_000;
const freshState = (): StoreState => ({ products, categories, coupons, campaigns, cart: [], couponCode: null, orders, notifications, messages });
type StoreActivity = Pick<StoreState, "orders" | "notifications" | "messages">;

type StoreContextValue = {
  state: StoreState;
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, color: string, quantity?: number) => void;
  updateQuantity: (productId: string, color: string, quantity: number) => void;
  removeFromCart: (productId: string, color: string) => void;
  setCouponCode: (code: string | null) => void;
  validateCoupon: (code: string | null, lines?: CartLine[]) => CouponResult;
  campaignResult: (lines?: CartLine[]) => CampaignResult;
  placeOrder: (details: Pick<Order, "customerName" | "customerEmail" | "address">) => Promise<Order | null>;
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
const money = (value: number) => Math.round(value * 100) / 100;
const api = async <T,>(path: string, method = "GET", body?: unknown): Promise<T | null> => {
  try { return await laravelRequest<T>(path, method, body); } catch (error) {
    console.warn("[Our Kitchen API]", error);
    return null;
  }
};
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<StoreState>(() => { try { const saved = localStorage.getItem(STORE_KEY); return saved ? { ...freshState(), ...JSON.parse(saved) } : freshState(); } catch { return freshState(); } });
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
      const remoteCart = cartId ? await api<{ cart: CartLine[]; couponCode: string | null }>(`/carts/${cartId}`) : null;
      if (!active || !remote) return;
      setState((current) => ({ ...freshState(), ...remote, cart: remoteCart?.cart?.length ? remoteCart.cart : current.cart, couponCode: remoteCart?.couponCode ?? current.couponCode }));
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
  useEffect(() => { if (hydrated && cartId) void api(`/carts/${cartId}`, "PUT", { cart: state.cart, couponCode: state.couponCode }); }, [cartId, hydrated, state.cart, state.couponCode]);

  const cartSubtotal = useMemo(() => state.cart.reduce((sum, line) => sum + (state.products.find((item) => item.id === line.productId)?.price ?? 0) * line.quantity, 0), [state.cart, state.products]);
  const validateCoupon = (code: string | null, lines = state.cart): CouponResult => {
    if (!code) return { valid: true, message: "No coupon applied.", discount: 0, freeShipping: false };
    const coupon = state.coupons.find((item) => item.code.toLowerCase() === code.toLowerCase());
    const subtotal = lines.reduce((sum, line) => sum + (state.products.find((item) => item.id === line.productId)?.price ?? 0) * line.quantity, 0);
    if (!coupon || !coupon.active) return { valid: false, message: "That kitchen code is not active.", discount: 0, freeShipping: false };
    if (new Date(coupon.expiresAt) < new Date()) return { valid: false, message: "That kitchen code has expired.", discount: 0, freeShipping: false };
    if (coupon.uses >= coupon.usageLimit) return { valid: false, message: "That kitchen code has reached its limit.", discount: 0, freeShipping: false };
    if (subtotal < coupon.minSpend) return { valid: false, message: `Add ${formatILS(coupon.minSpend - subtotal)} more to use this code.`, discount: 0, freeShipping: false };
    if (coupon.categoryIds?.length && lines.some((line) => !coupon.categoryIds?.includes(state.products.find((item) => item.id === line.productId)?.categoryId ?? ""))) return { valid: false, message: "This code is reserved for a different kitchen collection.", discount: 0, freeShipping: false };
    const discount = coupon.type === "percent" ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount ?? Infinity) : coupon.type === "fixed" ? coupon.value : 0;
    return { valid: true, message: coupon.type === "free_shipping" ? "Delivery is on us." : "Copper saved for this order.", discount: money(discount), freeShipping: coupon.type === "free_shipping" };
  };
  const campaignResult = (lines = state.cart): CampaignResult => {
    const now = Date.now();
    const active = state.campaigns.filter((campaign) => campaign.enabled && new Date(campaign.startsAt).getTime() <= now && new Date(campaign.endsAt).getTime() > now).sort((a, b) => b.priority - a.priority);
    for (const campaign of active) {
      const eligibleLines = lines.filter((line) => {
        const product = state.products.find((item) => item.id === line.productId);
        if (!product) return false;
        return campaign.targetType === "all" || (campaign.targetType === "brand" && campaign.targetValues.includes(product.brand)) || (campaign.targetType === "categories" && campaign.targetValues.includes(product.categoryId));
      });
      const eligibleSubtotal = eligibleLines.reduce((sum, line) => sum + (state.products.find((item) => item.id === line.productId)?.price ?? 0) * line.quantity, 0);
      if (!eligibleLines.length || eligibleSubtotal < campaign.minSpend) continue;
      const discount = campaign.type === "percent" ? Math.min(eligibleSubtotal * (campaign.value / 100), campaign.maxDiscount ?? Infinity) : campaign.type === "fixed" ? Math.min(campaign.value, eligibleSubtotal) : 0;
      return { campaign, eligibleSubtotal: money(eligibleSubtotal), discount: money(discount), freeShipping: campaign.type === "free_shipping" };
    }
    return { campaign: null, eligibleSubtotal: 0, discount: 0, freeShipping: false };
  };

  const value: StoreContextValue = {
    state, cartCount: state.cart.reduce((sum, line) => sum + line.quantity, 0), cartSubtotal, validateCoupon, campaignResult,
    addToCart: (productId, color, quantity = 1) => setState((current) => { const existing = current.cart.find((line) => line.productId === productId && line.color === color); return { ...current, cart: existing ? current.cart.map((line) => line === existing ? { ...line, quantity: line.quantity + quantity } : line) : [...current.cart, { productId, color, quantity }] }; }),
    updateQuantity: (productId, color, quantity) => setState((current) => ({ ...current, cart: quantity <= 0 ? current.cart.filter((line) => line.productId !== productId || line.color !== color) : current.cart.map((line) => line.productId === productId && line.color === color ? { ...line, quantity } : line) })),
    removeFromCart: (productId, color) => setState((current) => ({ ...current, cart: current.cart.filter((line) => line.productId !== productId || line.color !== color) })),
    setCouponCode: (couponCode) => setState((current) => ({ ...current, couponCode })),
    placeOrder: async (details) => {
      if (!user || !state.cart.length) return null;
      const couponResult = validateCoupon(state.couponCode); const activeCampaign = campaignResult(); const discount = (couponResult.valid ? couponResult.discount : 0) + activeCampaign.discount; const shipping = couponResult.freeShipping || activeCampaign.freeShipping || cartSubtotal >= 300 ? 0 : 18; const id = `CK-${String(Date.now()).slice(-6)}`;
      const order: Order & { campaignId?: string } = { id, createdAt: new Date().toISOString(), status: "placed", lines: state.cart.map((line) => { const product = state.products.find((item) => item.id === line.productId)!; return { ...line, name: product.name, price: product.price, image: product.image }; }), subtotal: cartSubtotal, discount, shipping, total: money(cartSubtotal - discount + shipping), couponCode: couponResult.valid ? state.couponCode ?? undefined : undefined, campaignId: activeCampaign.campaign?.id, ...details };
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
