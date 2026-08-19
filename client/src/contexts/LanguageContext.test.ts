import { describe, expect, it } from "vitest";
import { resolveInitialLanguage, saveLanguagePreference } from "./LanguageContext";

describe("resolveInitialLanguage", () => {
  it("defaults a new visitor to Arabic", () => {
    expect(resolveInitialLanguage("", null)).toBe("ar");
  });

  it("preserves an explicitly selected language on later visits", () => {
    expect(resolveInitialLanguage("", "en")).toBe("en");
    expect(resolveInitialLanguage("", "ar")).toBe("ar");
  });

  it("uses a direct language link as a one-visit override", () => {
    expect(resolveInitialLanguage("?lang=en", "ar")).toBe("en");
    expect(resolveInitialLanguage("?lang=ar", "en")).toBe("ar");
  });

  it("persists a language choice for both storefront and administrator route loads", () => {
    const values = new Map<string, string>();
    const storage = { setItem: (key: string, value: string) => values.set(key, value) };
    saveLanguagePreference(storage, "en");
    expect(resolveInitialLanguage("/", values.get("our-kitchen-language-preference") ?? null)).toBe("en");
    expect(resolveInitialLanguage("/admin/login", values.get("our-kitchen-language-preference") ?? null)).toBe("en");
    saveLanguagePreference(storage, "ar");
    expect(resolveInitialLanguage("/", values.get("our-kitchen-language-preference") ?? null)).toBe("ar");
    expect(resolveInitialLanguage("/admin/login", values.get("our-kitchen-language-preference") ?? null)).toBe("ar");
  });
});
