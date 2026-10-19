import { describe, expect, it } from "vitest";
import { campaignFor, cartTotalsFor, couponExpired, couponFor, productPricingFor } from "./pricing";
import type { Campaign, CartLine, Coupon, Product } from "./types";

const NOW = new Date("2026-10-19T12:00:00").getTime();
const product = (id: string, price: number, extra: Partial<Product> = {}): Product => ({ id, name: id, brand: "Villa", price, categoryId: "bedding", image: "", gallery: [], description: "", features: [], stock: 10, colors: ["Oat"], sizes: [], ...extra });
const campaign = (extra: Partial<Campaign>): Campaign => ({ id: "c1", name: "Sale", type: "percent", value: 10, targetType: "all", targetValues: [], startsAt: "2026-10-01T00:00", endsAt: "2026-11-01T00:00", enabled: true, ...extra });
const coupon = (extra: Partial<Coupon>): Coupon => ({ id: "k1", code: "SAVE", type: "percent", value: 10, usageLimit: null, uses: 0, expiresAt: "2026-12-31", active: true, ...extra });
const line = (productId: string, quantity = 1): CartLine => ({ productId, quantity, color: "Oat", size: "" });

const products = [product("quilt", 300, { compareAt: 550 }), product("mug", 50, { categoryId: "kitchen", brand: "Dorsha" }), product("pillow", 100)];

describe("product shelf pricing", () => {
  it("shows compareAt as the struck price with the percent saved", () => {
    expect(productPricingFor(products[0], [], NOW)).toMatchObject({ price: 300, was: 550, percentOff: 45 });
  });
  it("prices a percent campaign into the shelf price", () => {
    expect(productPricingFor(products[2], [campaign({ value: 20 })], NOW)).toMatchObject({ price: 80, was: 100, percentOff: 20, offer: undefined });
  });
  it("shows fixed and free-delivery campaigns as an offer, not a new price", () => {
    for (const offer of [campaign({ type: "fixed", value: 30 }), campaign({ type: "free_shipping", value: 0 })]) {
      const pricing = productPricingFor(products[2], [offer], NOW);
      expect(pricing.price).toBe(100);
      expect(pricing.offer?.id).toBe("c1");
    }
  });
  it("only marks products a product-targeted campaign covers", () => {
    const sale = campaign({ targetType: "products", targetValues: ["pillow"] });
    expect(productPricingFor(products[2], [sale], NOW).price).toBe(90);
    expect(productPricingFor(products[1], [sale], NOW).price).toBe(50);
  });
  it("ignores paused, future and ended campaigns", () => {
    for (const off of [campaign({ enabled: false }), campaign({ startsAt: "2026-10-20T00:00" }), campaign({ endsAt: "2026-10-19T00:00" })]) expect(productPricingFor(products[2], [off], NOW).price).toBe(100);
  });
});

describe("campaigns at checkout", () => {
  it("matches the shelf price for a percent campaign", () => {
    const result = campaignFor([line("pillow", 3)], { products, campaigns: [campaign({ value: 20 })] }, NOW);
    expect(300 - result.discount).toBe(productPricingFor(products[2], [campaign({ value: 20 })], NOW).price * 3);
  });
  it("applies a fixed amount once per order, capped at the eligible items", () => {
    expect(campaignFor([line("pillow", 2)], { products, campaigns: [campaign({ type: "fixed", value: 30 })] }, NOW).discount).toBe(30);
    expect(campaignFor([line("mug")], { products, campaigns: [campaign({ type: "fixed", value: 80 })] }, NOW).discount).toBe(50);
  });
  it("reports the saving as a percentage of the items it covers", () => {
    expect(campaignFor([line("pillow")], { products, campaigns: [campaign({})] }, NOW)).toMatchObject({ discount: 10, percentOff: 10 });
    expect(campaignFor([line("pillow"), line("mug")], { products, campaigns: [campaign({ type: "fixed", value: 30 })] }, NOW).percentOff).toBe(20);
  });
  it("picks the earliest-starting live campaign when several cover the bag", () => {
    const later = campaign({ id: "c2", value: 30, startsAt: "2026-10-10T00:00" });
    expect(campaignFor([line("pillow")], { products, campaigns: [later, campaign({})] }, NOW).campaign?.id).toBe("c1");
  });
  it("discounts only targeted products", () => {
    const result = campaignFor([line("pillow"), line("mug")], { products, campaigns: [campaign({ value: 50, targetType: "products", targetValues: ["mug"] })] }, NOW);
    expect(result.discount).toBe(25);
  });
});

describe("coupons", () => {
  const catalog = (coupons: Coupon[], campaigns: Campaign[] = []) => ({ products, campaigns, coupons });
  it("computes percent, fixed and free-delivery coupons", () => {
    expect(couponFor("save", [line("pillow")], catalog([coupon({})]), NOW)).toMatchObject({ valid: true, discount: 10 });
    expect(couponFor("SAVE", [line("pillow")], catalog([coupon({ type: "fixed", value: 25 })]), NOW).discount).toBe(25);
    expect(couponFor("SAVE", [line("mug")], catalog([coupon({ type: "fixed", value: 500 })]), NOW).discount).toBe(50);
    expect(couponFor("SAVE", [line("mug")], catalog([coupon({ type: "free_shipping", value: 0 })]), NOW)).toMatchObject({ valid: true, discount: 0, freeShipping: true });
  });
  it("applies after the campaign instead of on the original price", () => {
    // 45% campaign on a 300 quilt leaves 165; a 10% coupon takes 16.50, not 30.
    expect(couponFor("SAVE", [line("quilt")], catalog([coupon({})], [campaign({ value: 45 })]), NOW).discount).toBe(16.5);
  });
  it("discounts only the products it targets, without blocking the rest of the bag", () => {
    const productCoupon = coupon({ value: 50, productIds: ["mug"] });
    expect(couponFor("SAVE", [line("pillow"), line("mug", 2)], catalog([productCoupon]), NOW)).toMatchObject({ valid: true, discount: 50 });
    expect(couponFor("SAVE", [line("pillow")], catalog([productCoupon]), NOW)).toMatchObject({ valid: false, message: "This code is reserved for a different kitchen tool." });
  });
  it("discounts only the collection it targets", () => {
    const categoryCoupon = coupon({ value: 10, categoryIds: ["bedding"] });
    expect(couponFor("SAVE", [line("pillow"), line("mug")], catalog([categoryCoupon]), NOW).discount).toBe(10);
    expect(couponFor("SAVE", [line("mug")], catalog([categoryCoupon]), NOW).valid).toBe(false);
  });
  it("shares the campaign saving across its items when only some are coupon targets", () => {
    // Fixed 30 campaign on pillow (100) + mug (50): the mug carries 10 of it, so a 50% mug coupon takes 20.
    expect(couponFor("SAVE", [line("pillow"), line("mug")], catalog([coupon({ value: 50, productIds: ["mug"] })], [campaign({ type: "fixed", value: 30 })]), NOW).discount).toBe(20);
  });
  it("rejects inactive, used-up and expired codes", () => {
    expect(couponFor("SAVE", [line("pillow")], catalog([coupon({ active: false })]), NOW).valid).toBe(false);
    expect(couponFor("SAVE", [line("pillow")], catalog([coupon({ usageLimit: 5, uses: 5 })]), NOW).valid).toBe(false);
    expect(couponFor("SAVE", [line("pillow")], catalog([coupon({ expiresAt: "2026-10-18" })]), NOW).valid).toBe(false);
  });
  it("keeps a code valid for the whole of its expiry day, whatever the date format", () => {
    for (const expiresAt of ["2026-10-19", "2026-10-19 00:00:00", "2026-10-19T00:00:00.000000Z"]) expect(couponExpired(expiresAt, NOW)).toBe(false);
    expect(couponExpired("2026-10-18", NOW)).toBe(true);
  });
});

describe("cart totals", () => {
  it("never lets discounts push the total below delivery", () => {
    const totals = cartTotalsFor([line("mug")], "SAVE", { products, campaigns: [campaign({ type: "fixed", value: 40 })], coupons: [coupon({ type: "fixed", value: 40 })] }, "delivery", NOW);
    expect(totals).toMatchObject({ subtotal: 50, discount: 50, shipping: 18, total: 18 });
  });
  it("waives delivery for pickup, free-delivery offers and big orders", () => {
    const base = { products, campaigns: [] as Campaign[], coupons: [coupon({ type: "free_shipping", value: 0 })] };
    expect(cartTotalsFor([line("mug")], null, base, "delivery", NOW).shipping).toBe(18);
    expect(cartTotalsFor([line("mug")], null, base, "pickup", NOW).shipping).toBe(0);
    expect(cartTotalsFor([line("mug")], "SAVE", base, "delivery", NOW).shipping).toBe(0);
    expect(cartTotalsFor([line("mug")], null, { ...base, campaigns: [campaign({ type: "free_shipping", value: 0 })] }, "delivery", NOW).shipping).toBe(0);
    expect(cartTotalsFor([line("quilt", 2)], null, base, "delivery", NOW).shipping).toBe(0);
  });
  it("adds campaign and coupon savings into one total", () => {
    const totals = cartTotalsFor([line("quilt")], "SAVE", { products, campaigns: [campaign({ value: 45 })], coupons: [coupon({})] }, "delivery", NOW);
    expect(totals).toMatchObject({ subtotal: 300, discount: 151.5, shipping: 18, total: 166.5 });
    expect(totals.coupon.percentOff).toBe(10);
  });
  it("gives each line a struck original and a payable price that add up to the total", () => {
    const totals = cartTotalsFor([line("pillow", 2), line("mug")], "SAVE", { products, campaigns: [campaign({ value: 20, targetType: "products", targetValues: ["pillow"] })], coupons: [coupon({ productIds: ["mug"] })] }, "delivery", NOW);
    expect(totals.lines.map(({ price, was, percentOff }) => ({ price, was, percentOff }))).toEqual([{ price: 160, was: 200, percentOff: 20 }, { price: 45, was: 50, percentOff: 10 }]);
    expect(totals.lines.reduce((sum, item) => sum + item.price, 0)).toBe(totals.subtotal - totals.discount);
  });
  it("strikes the compare-at price on lines with no campaign or coupon", () => {
    const [quilt] = cartTotalsFor([line("quilt")], null, { products, campaigns: [], coupons: [] }, "delivery", NOW).lines;
    expect(quilt).toMatchObject({ price: 300, was: 550, percentOff: 45 });
    expect(cartTotalsFor([line("pillow")], null, { products, campaigns: [], coupons: [] }, "delivery", NOW).lines[0].was).toBeUndefined();
  });
});
