/** Copperline Atelier language layer: persistent English/Arabic switching plus live direction-aware interface translation. */
import { createContext, useContext, useEffect, useState } from "react";
import { translateText } from "@/lib/i18n";

export type Language = "en" | "ar";
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; toggleLanguage: () => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANGUAGE_KEY = "our-kitchen-language";

function translateRoot(root: ParentNode, language: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) return;
    const translated = translateText(node.data, language);
    if (translated !== node.data) node.data = translated;
  });
  if (!(root instanceof Element) && !(root instanceof Document)) return;
  const elements = root.querySelectorAll<HTMLElement>("[placeholder], [title], [aria-label]");
  elements.forEach((element) => ["placeholder", "title", "aria-label"].forEach((attribute) => {
    const value = element.getAttribute(attribute);
    if (value) {
      const translated = translateText(value, language);
      if (translated !== value) element.setAttribute(attribute, translated);
    }
  }));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    return requested === "ar" || (!requested && localStorage.getItem(LANGUAGE_KEY) === "ar") ? "ar" : "en";
  });
  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("rtl", language === "ar");
    document.title = language === "ar" ? "مطبخنا — كوبر آند كو" : "Our Kitchen — Copper & Co.";
    const apply = () => translateRoot(document.body, language);
    const frame = requestAnimationFrame(apply);
    const observer = new MutationObserver((records) => records.forEach((record) => {
      if (record.type === "characterData") translateRoot(record.target.parentNode ?? document.body, language);
      record.addedNodes.forEach((node) => {
        if (node instanceof Element || node instanceof Text) translateRoot(node instanceof Text ? node.parentNode ?? document.body : node, language);
      });
    }));
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage: () => setLanguage((current) => current === "en" ? "ar" : "en") }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
