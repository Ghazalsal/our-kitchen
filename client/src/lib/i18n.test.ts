import { describe, expect, it } from "vitest";
import { translateText } from "./i18n";

describe("translateText order notifications", () => {
  const en = "New order CK-525960 placed by Ghazal Salameh for ₪580.00.";
  const ar = "طلب جديد CK-525960 من Ghazal Salameh بقيمة ₪580.00.";

  it("translates the new-order notification both ways", () => {
    expect(translateText(en, "ar")).toBe(ar);
    expect(translateText(ar, "en")).toBe(en);
  });

  it("translates the older notification wording", () => {
    expect(translateText("CK-525960 has been placed for ₪580.00.", "ar")).toBe("تم تقديم الطلب CK-525960 بقيمة ₪580.00.");
  });
});
