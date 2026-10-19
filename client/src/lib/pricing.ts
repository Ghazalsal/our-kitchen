/** Our Kitchen pricing rules: campaigns, coupons and totals as pure functions. StoreApiController mirrors these when an order is placed. */
import { FREE_DELIVERY_THRESHOLD } from "./money";
import type { Campaign, CampaignResult, CartLine, CartLinePrice, CartTotals, Coupon, CouponResult, FulfillmentMethod, Product, ProductPricing } from "./types";

export const DELIVERY_FEE = 18;
export const money = (value: number) => Math.round(value * 100) / 100;

type Catalog = { products: Product[]; campaigns: Campaign[]; coupons: Coupon[] };
type PricedLine = { line: CartLine; product: Product; amount: number };

const priceLines = (lines: CartLine[], products: Product[]): PricedLine[] => lines.flatMap((line) => {
  const product = products.find((item) => item.id === line.productId);
  return product ? [{ line, product, amount: product.price * line.quantity }] : [];
});
const sum = (lines: PricedLine[]) => lines.reduce((total, line) => total + line.amount, 0);
/** A discount as a share of what it was taken from, to one decimal (10, 12.5). */
const percentOf = (discount: number, base: number) => base > 0 && discount > 0 ? Math.round((discount / base) * 1000) / 10 : 0;

/** Live campaigns in the order the server picks them: earliest start first. */
export const liveCampaigns = (campaigns: Campaign[], now = Date.now()) => campaigns
  .filter((campaign) => campaign.enabled && new Date(campaign.startsAt).getTime() <= now && new Date(campaign.endsAt).getTime() > now)
  .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

export const campaignTargets = (campaign: Campaign, product: Product) => campaign.targetType === "all"
  || (campaign.targetType === "brand" && campaign.targetValues.includes(product.brand))
  || (campaign.targetType === "categories" && campaign.targetValues.includes(product.categoryId))
  || (campaign.targetType === "products" && campaign.targetValues.includes(product.id));

/** A coupon with no collections or products selected covers the whole store. */
export const couponTargets = (coupon: Coupon, product: Product) => {
  const categories = coupon.categoryIds?.filter(Boolean) ?? []; const productIds = coupon.productIds?.filter(Boolean) ?? [];
  if (!categories.length && !productIds.length) return true;
  return categories.includes(product.categoryId) || productIds.includes(product.id);
};

/** expiresAt is a calendar date (sometimes serialised with a midnight time): the code works through the end of that day. */
export const couponExpired = (expiresAt: string, now = Date.now()) => {
  const day = /^(\d{4}-\d{2}-\d{2})(?:[ T]00:00(?::00(?:\.0+)?)?(?:Z|[+-]00:?00)?)?$/.exec(expiresAt.trim());
  return new Date(day ? `${day[1]}T23:59:59.999` : expiresAt).getTime() < now;
};

const percentOrFixed = (offer: { type: Coupon["type"]; value: number }, base: number) =>
  offer.type === "percent" ? base * Math.min(offer.value, 100) / 100 : offer.type === "fixed" ? Math.min(offer.value, base) : 0;

/** One automatic campaign per order: the first live campaign (earliest start) that covers something in the bag. */
export function campaignFor(lines: CartLine[], catalog: Pick<Catalog, "products" | "campaigns">, now = Date.now()): CampaignResult {
  const priced = priceLines(lines, catalog.products);
  for (const campaign of liveCampaigns(catalog.campaigns, now)) {
    const eligible = priced.filter(({ product }) => campaignTargets(campaign, product));
    const eligibleSubtotal = sum(eligible);
    if (!eligible.length) continue;
    const discount = money(percentOrFixed(campaign, eligibleSubtotal));
    return { campaign, eligibleSubtotal: money(eligibleSubtotal), discount, percentOff: percentOf(discount, eligibleSubtotal), freeShipping: campaign.type === "free_shipping" };
  }
  return { campaign: null, eligibleSubtotal: 0, discount: 0, percentOff: 0, freeShipping: false };
}

/**
 * A coupon discounts only the items it covers, and only what is left of them after the campaign
 * (the campaign's saving is shared across its items by value). Other items in the bag never block the code.
 */
export function couponFor(code: string | null, lines: CartLine[], catalog: Catalog, now = Date.now()): CouponResult {
  if (!code) return { valid: true, message: "No coupon applied.", discount: 0, percentOff: 0, freeShipping: false };
  const fail = (message: string): CouponResult => ({ valid: false, message, discount: 0, percentOff: 0, freeShipping: false });
  const coupon = catalog.coupons.find((item) => item.code.toLowerCase() === code.toLowerCase());
  if (!coupon || !coupon.active) return fail("That kitchen code is not active.");
  if (couponExpired(coupon.expiresAt, now)) return fail("That kitchen code has expired.");
  if (coupon.usageLimit && coupon.uses >= coupon.usageLimit) return fail("That kitchen code has reached its limit.");
  const eligible = priceLines(lines, catalog.products).filter(({ product }) => couponTargets(coupon, product));
  if (!eligible.length) return fail(coupon.productIds?.length ? "This code is reserved for a different kitchen tool." : "This code is reserved for a different kitchen collection.");
  const campaign = campaignFor(lines, catalog, now);
  const campaignShare = campaign.campaign && campaign.eligibleSubtotal > 0 ? campaign.discount * sum(eligible.filter(({ product }) => campaignTargets(campaign.campaign!, product))) / campaign.eligibleSubtotal : 0;
  const payable = money(sum(eligible) - campaignShare);
  const discount = money(percentOrFixed(coupon, payable));
  return { valid: true, message: coupon.type === "free_shipping" ? "Delivery is on us." : "Discount applied to this order.", discount, percentOff: percentOf(discount, payable), freeShipping: coupon.type === "free_shipping" };
}

export function cartTotalsFor(lines: CartLine[], couponCode: string | null, catalog: Catalog, fulfillment: FulfillmentMethod = "delivery", now = Date.now()): CartTotals {
  const subtotal = money(sum(priceLines(lines, catalog.products)));
  const coupon = couponFor(couponCode, lines, catalog, now); const campaign = campaignFor(lines, catalog, now);
  const couponDiscount = coupon.valid ? coupon.discount : 0;
  const discount = money(Math.min(subtotal, couponDiscount + campaign.discount));
  const shipping = fulfillment === "pickup" || (coupon.valid && coupon.freeShipping) || campaign.freeShipping || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return { subtotal, coupon, couponDiscount, campaign, discount, shipping, total: money(Math.max(0, subtotal - discount + shipping)), lines: linePricesFor(lines, couponCode, catalog, campaign, couponDiscount) };
}

/** The struck and payable price of one bag line, matched by product, finish and size. */
export function linePriceFor(prices: CartLinePrice[], line: CartLine): Pick<CartLinePrice, "price" | "was"> | undefined {
  const match = prices.find((item) => item.line.productId === line.productId && item.line.color === line.color && item.line.size === line.size);
  return match && { price: match.price, was: match.was };
}

/**
 * Each bag line's struck and payable price. The campaign's saving is shared across the lines it covers by value, then the
 * coupon's across the lines it covers by what is left of them, so the payable prices add up to subtotal − discount.
 */
function linePricesFor(lines: CartLine[], couponCode: string | null, catalog: Catalog, campaign: CampaignResult, couponDiscount: number): CartLinePrice[] {
  const priced = priceLines(lines, catalog.products);
  const afterCampaign = priced.map(({ product, amount }) => amount - (campaign.campaign && campaign.eligibleSubtotal > 0 && campaignTargets(campaign.campaign, product) ? campaign.discount * amount / campaign.eligibleSubtotal : 0));
  const coupon = couponDiscount > 0 ? catalog.coupons.find((item) => item.code.toLowerCase() === couponCode?.toLowerCase()) : undefined;
  const covered = priced.map(({ product }) => !!coupon && couponTargets(coupon, product));
  const couponBase = afterCampaign.reduce((total, amount, index) => total + (covered[index] ? amount : 0), 0);
  return priced.map(({ line, product }, index) => {
    const price = money(afterCampaign[index] - (covered[index] && couponBase > 0 ? couponDiscount * afterCampaign[index] / couponBase : 0));
    const was = money(Math.max(product.compareAt ?? 0, product.price) * line.quantity);
    return was > price ? { line, price, was, percentOff: Math.round((1 - price / was) * 100) } : { line, price, percentOff: 0 };
  });
}

/**
 * The shelf price. A percent campaign is priced in; fixed-amount and free-delivery campaigns are order-level,
 * so they are returned as `offer` for a badge instead.
 */
export function productPricingFor(product: Product, campaigns: Campaign[], now = Date.now()): ProductPricing {
  const campaign = liveCampaigns(campaigns, now).find((item) => campaignTargets(item, product));
  const pricedIn = campaign?.type === "percent" && campaign.value > 0;
  const offer = campaign && !pricedIn && (campaign.type === "free_shipping" || campaign.value > 0) ? campaign : undefined;
  const price = pricedIn ? money(product.price * (1 - Math.min(campaign.value, 100) / 100)) : product.price;
  const was = Math.max(product.compareAt ?? 0, product.price);
  return was > price ? { price, was, percentOff: Math.round((1 - price / was) * 100), offer } : { price, percentOff: 0, offer };
}
