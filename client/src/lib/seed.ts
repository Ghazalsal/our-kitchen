/** Copperline Atelier seed: tactile kitchen appliance catalogue and working sample commerce data. */
import type { Campaign, Category, Coupon, Order, Product, StoreNotification, ThreadMessage } from "./types";

const hero = "/catalog/hero.webp";
const espresso = "/catalog/espresso.webp";
const baking = "/catalog/baking.webp";
const prep = "/catalog/prep.webp";
const kettle = "/catalog/kettle.webp";
const blender = "/catalog/blender.webp";
const grill = "/catalog/grill.webp";
const toaster = "/catalog/toaster.webp";
const dorshaServing = "/catalog/dorsha-serving.jpg";
const dorshaCups = "/catalog/dorsha-cups.jpeg";
const dorshaPlates = "/catalog/dorsha-plates.jpg";
const dorshaCutlery = "/catalog/dorsha-cutlery.jpg";

export const categories: Category[] = [
  { id: "brew", name: "Brew & pour", description: "Coffee, tea and the unhurried cup.", image: espresso, hue: "copper" },
  { id: "prepare", name: "Prepare", description: "Process, slice and make every prep count.", image: prep, hue: "brass" },
  { id: "bake", name: "Bake & roast", description: "Countertop heat for daily rituals.", image: baking, hue: "ink" },
  { id: "mix", name: "Mix & make", description: "The reliable workhorse for dough and batter.", image: hero, hue: "cream" },
  { id: "dorsha-cups", name: "Cups & mugs", description: "Dorsha pieces for the first pour and the long pause.", image: dorshaCups, hue: "cream" },
  { id: "dorsha-plates", name: "Plates & bowls", description: "Tableware made to make the everyday meal feel set.", image: dorshaPlates, hue: "brass" },
  { id: "dorsha-cutlery", name: "Spoons & cutlery", description: "The small, useful pieces that finish a place setting.", image: dorshaCutlery, hue: "ink" },
  { id: "dorsha-serve", name: "Serve & share", description: "Generous bowls and platters for a table with room for more.", image: dorshaServing, hue: "copper" },
];

export const products: Product[] = [
  {
    id: "morrow-mixer",
    name: "Morrow Stand Mixer",
    brand: "Morrow", price: 429, compareAt: 499, categoryId: "mix", badge: "Atelier pick", image: hero,
    gallery: [hero, prep, baking], description: "A counterworthy mixer with a deep bowl, quiet torque and the kind of weight that keeps a dough steady.",
    features: ["5.2L stoneware bowl", "10 speed settings", "Tilt-head construction", "Two-year atelier care"], stock: 8, colors: ["Copper", "Oat", "Espresso"], featured: true, deal: true,
  },
  {
    id: "faro-espresso",
    name: "Faro Espresso Set",
    brand: "Faro", price: 589, categoryId: "brew", badge: "Small batch", image: espresso,
    gallery: [espresso, hero, prep], description: "A considered home espresso station with a low-slung profile, even pressure and a warm, copper-toned finish.",
    features: ["15-bar pressure", "Integrated steam wand", "Single and double baskets", "Removable brass drip tray"], stock: 4, colors: ["Burnished copper", "Ink"], featured: true,
  },
  {
    id: "brine-oven",
    name: "Brine Countertop Oven",
    brand: "Brine", price: 269, compareAt: 319, categoryId: "bake", badge: "A warm deal", image: baking,
    gallery: [baking, hero, prep], description: "For crisp vegetables, tiny loaves and a weeknight roast when the main oven can stay dark.",
    features: ["Six cooking modes", "Fits a 9-inch pan", "Dual quartz heat", "Crumb tray included"], stock: 13, colors: ["Brass", "Cream"], featured: true, deal: true,
  },
  {
    id: "soma-processor",
    name: "Soma Prep Processor",
    brand: "Soma", price: 199, categoryId: "prepare", badge: "New arrival", image: prep,
    gallery: [prep, hero, baking], description: "A compact processor for weeknight sauces, citrus dressings, chopped herbs and a well-stocked counter.",
    features: ["1.8L work bowl", "Pulse precision", "Three steel discs", "Dishwasher-safe parts"], stock: 5, colors: ["Copper", "Fennel"], featured: true,
  },
  {
    id: "aura-kettle",
    name: "Aura Variable Kettle",
    brand: "Aura", price: 149, categoryId: "brew", image: kettle,
    gallery: [kettle, espresso, hero], description: "A precise gooseneck kettle for coffee, tea and the sort of slow mornings that deserve a better pour.",
    features: ["40–100°C control", "Keep-warm mode", "Balanced gooseneck spout", "1L capacity"], stock: 21, colors: ["Oat", "Ink"], deal: true,
  },
  {
    id: "field-blender",
    name: "Field High-Speed Blender",
    brand: "Field", price: 349, categoryId: "prepare", image: blender,
    gallery: [blender, prep, hero], description: "Strong enough for soup, silk-smooth for a sauce and quiet enough to leave the morning gentle.",
    features: ["2L thermal jar", "Six blade steel core", "Four program settings", "Sound-dampened base"], stock: 2, colors: ["Espresso", "Cream"], featured: true,
  },
  {
    id: "linden-grill",
    name: "Linden Table Grill",
    brand: "Linden", price: 219, categoryId: "bake", image: grill,
    gallery: [grill, baking, prep], description: "A compact grill for charred greens, late lunches and a very good piece of fish.",
    features: ["Cast grill plate", "Precise temperature dial", "Low-smoke tray", "Indoor-safe design"], stock: 10, colors: ["Brass", "Ink"], deal: true,
  },
  {
    id: "flint-toaster",
    name: "Flint Long-Slot Toaster",
    brand: "Flint", price: 119, categoryId: "bake", image: toaster,
    gallery: [toaster, baking, hero], description: "A long-slot toaster for sourdough slices, bagels and the bread worth treating properly.",
    features: ["Four shade settings", "Long-slot design", "Lift-and-look lever", "Crumb tray"], stock: 18, colors: ["Copper", "Oat"],
  },
  {
    id: "dorsha-ember-cup-set",
    name: "Dorsha Ember Cup Set",
    brand: "Dorsha", price: 129, compareAt: 149, categoryId: "dorsha-cups", image: dorshaCups,
    gallery: [dorshaCups, dorshaPlates, dorshaServing], description: "Four tactile stoneware cups with a softly weighted handle and a warm, everyday glaze.",
    features: ["Set of four", "280ml capacity", "Stoneware body", "Dishwasher-safe"], stock: 24, colors: ["Oat", "Moss"],
  },
  {
    id: "dorsha-quiet-plate-set",
    name: "Dorsha Quiet Plate Set",
    brand: "Dorsha", price: 189, categoryId: "dorsha-plates", image: dorshaPlates,
    gallery: [dorshaPlates, dorshaCups, dorshaCutlery], description: "A six-piece dinner plate set with a low rim and calm, stackable proportions.",
    features: ["Set of six", "26cm diameter", "Low-rim profile", "Stack-friendly"], stock: 18, colors: ["Milk", "Clay"],
  },
  {
    id: "dorsha-brass-spoon-set",
    name: "Dorsha Brass Spoon Set",
    brand: "Dorsha", price: 109, categoryId: "dorsha-cutlery", image: dorshaCutlery,
    gallery: [dorshaCutlery, dorshaPlates, dorshaServing], description: "Six slim serving and dessert spoons with a warm brushed finish for the daily table.",
    features: ["Set of six", "Brushed stainless steel", "Dessert and serving size", "Hand-wash recommended"], stock: 31, colors: ["Brass"],
  },
  {
    id: "dorsha-gather-serving-bowl",
    name: "Dorsha Gather Serving Bowl",
    brand: "Dorsha", price: 159, categoryId: "dorsha-serve", image: dorshaServing,
    gallery: [dorshaServing, dorshaCups, dorshaPlates], description: "A generous, hand-finished bowl for salads, fruit, or the center of a table that stays awhile.",
    features: ["3.2L capacity", "Hand-finished glaze", "Wide sharing profile", "Food-safe stoneware"], stock: 12, colors: ["Terracotta", "Oat"],
  },
];

export const coupons: Coupon[] = [
  { id: "copper10", code: "COPPER10", type: "percent", value: 10, minSpend: 150, maxDiscount: 70, usageLimit: 100, uses: 8, expiresAt: "2026-12-31", active: true },
  { id: "bake-25", code: "BAKE25", type: "fixed", value: 25, minSpend: 220, usageLimit: 40, uses: 11, expiresAt: "2026-10-01", categoryIds: ["bake"], active: true },
  { id: "countership", code: "COUNTERSHIP", type: "free_shipping", value: 0, minSpend: 80, usageLimit: 200, uses: 31, expiresAt: "2026-12-31", active: true },
];

export const campaigns: Campaign[] = [];

export const orders: Order[] = [
  { id: "CK-18042", createdAt: "2026-08-15T10:30:00.000Z", status: "preparing", lines: [{ productId: "morrow-mixer", quantity: 1, color: "Copper", name: "Morrow Stand Mixer", price: 429, image: hero }], subtotal: 429, discount: 42.9, shipping: 0, total: 386.1, couponCode: "COPPER10", customerName: "Maya O’Neil", customerEmail: "maya@example.com", address: "41 Alder Street, Portland, OR 97205" },
  { id: "CK-18031", createdAt: "2026-08-10T14:15:00.000Z", status: "delivered", lines: [{ productId: "aura-kettle", quantity: 1, color: "Oat", name: "Aura Variable Kettle", price: 149, image: espresso }], subtotal: 149, discount: 0, shipping: 18, total: 167, customerName: "Maya O’Neil", customerEmail: "maya@example.com", address: "41 Alder Street, Portland, OR 97205" },
];

export const messages: ThreadMessage[] = [
  { id: "msg-1", orderId: "CK-18042", sender: "customer", body: "Could you let me know whether the bowl is packed separately?", createdAt: "2026-08-16T09:30:00.000Z" },
  { id: "msg-2", orderId: "CK-18042", sender: "admin", body: "Absolutely — the bowl is wrapped separately inside the outer carton for safe arrival.", createdAt: "2026-08-16T11:05:00.000Z" },
];

export const notifications: StoreNotification[] = [
  { id: "note-1", audience: "admin", title: "Low stock: Faro Espresso Set", body: "Only 4 pieces remain on the shelf.", createdAt: "2026-08-18T08:00:00.000Z", read: false },
  { id: "note-2", audience: "customer", title: "Your order is in the kitchen", body: "CK-18042 is being prepared with care.", createdAt: "2026-08-16T11:06:00.000Z", read: false, orderId: "CK-18042" },
];
