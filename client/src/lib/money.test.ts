import { describe, expect, it } from "vitest";
import { formatILS } from "./money";

describe("formatILS", () => {
  it("formats monetary values in Israeli shekels", () => {
    const result = formatILS(429);
    expect(result).toContain("429");
    expect(result).toMatch(/₪/u);
  });

  it("retains fractional amounts used by discounts and delivery totals", () => {
    const result = formatILS(18.5);
    expect(result).toContain("18.5");
    expect(result).toMatch(/₪/u);
  });
});
