import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
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

// Every toast and coupon message must reach Arabic shoppers in Arabic. Interpolated values (names, amounts)
// are replaced with a sample before translating; brand names and codes may stay in Latin script.
const src = fileURLToPath(new URL("..", import.meta.url));
const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => { const path = join(dir, name); return statSync(path).isDirectory() ? (name === "ui" ? [] : files(path)) : /\.tsx?$/.test(name) && !name.endsWith(".test.ts") ? [path] : []; });
const literals = (code: string) => [...code.matchAll(/"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map((m) => (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, "Lemnos"));
const argumentsOf = (code: string, start: number) => { let depth = 0; for (let i = start; i < code.length; i += 1) { if (code[i] === "(") depth += 1; if (code[i] === ")" && --depth === 0) return code.slice(start, i); } return ""; };
const userMessages = files(src).flatMap((file) => {
  const code = readFileSync(file, "utf8");
  const calls = [...code.matchAll(/\b(?:toast\.(?:success|error|info|warning|message)|fail)\(/g)].map((m) => argumentsOf(code, m.index! + m[0].length - 1));
  const messages = [...code.matchAll(/\bmessage: "((?:[^"\\]|\\.)*)"/g)].map((m) => `"${m[1]}"`);
  return [...calls, ...messages].flatMap(literals).filter((text) => /[A-Za-z]{3}/.test(text) && /\s/.test(text));
});
const leftoverEnglish = (text: string) => translateText(text, "ar").replace(/Lemnos|Copper & Co\.|COPPER10|Our Kitchen/g, "").match(/[A-Za-z]{3,}/g);

describe("Arabic coverage", () => {
  it("finds the storefront's toast and coupon messages", () => {
    expect(userMessages.length).toBeGreaterThan(40);
    expect(userMessages).toContain("That kitchen code has expired.");
  });

  it.each([...new Set(userMessages)])("translates %s", (text) => {
    expect(leftoverEnglish(text)).toBeNull();
  });

  it("translates Laravel errors that surface in toasts", () => {
    for (const text of [
      "The email has already been taken.",
      "The phone has already been taken.",
      "The password field confirmation does not match.",
      "The password field must be at least 8 characters.",
      "The password field must contain at least one symbol.",
      "The email field must be a valid email address.",
      "The name field is required.",
      "The email has already been taken. (and 2 more errors)",
      "These credentials do not match our records.",
      "Verify your email before placing an order.",
      "One or more order products are unavailable.",
      "A percent discount cannot exceed 100%.",
    ]) expect(leftoverEnglish(text), text).toBeNull();
  });

  it("translates offer labels, coupon hints and product aria labels", () => {
    expect(translateText("20% off", "ar")).toBe("خصم 20%");
    expect(translateText("Free delivery", "ar")).toBe("توصيل مجاني");
    expect(translateText("Add ₪50 more to use this code.", "ar")).toBe("أضف ₪50 لاستخدام هذا الرمز.");
    expect(translateText("Add Lemnos quilt to bag", "ar")).toBe("أضف Lemnos quilt إلى السلة");
  });
});
