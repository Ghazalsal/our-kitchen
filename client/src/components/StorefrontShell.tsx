/** Copperline Atelier shell: editorial navigation, quiet notification signals, and a practical mobile escape route. */
import { useMemo, useState } from "react";
import { Bell, ChefHat, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useStore } from "@/contexts/StoreContext";
import { CartDrawer } from "./CartDrawer";
import { useLanguage } from "@/contexts/LanguageContext";

const mark = "/manus-storage/our-kitchen-app-icon_ce4e2e34.png";

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return <Link href="/" className={`group inline-flex items-center gap-2.5 ${dark ? "text-[#FAF6F0]" : "text-[#17130F]"}`}>
    <img src={mark} alt="Our Kitchen" className={`h-10 w-10 rounded-full object-contain transition duration-200 group-hover:rotate-6 ${dark ? "ring-1 ring-[#6A5543]" : "ring-1 ring-[#E6D7C7]"}`} />
    <span className="leading-none"><b className="block font-['Fraunces'] text-xl tracking-[-0.05em]">Our</b><span className="block pt-0.5 text-[8px] font-bold uppercase tracking-[0.28em]">Kitchen</span></span>
  </Link>;
}

export function LanguageToggle({ dark = false }: { dark?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const surface = dark ? "border-[#6A5543] text-[#FAF6F0]" : "border-[#D7C6B6] text-[#17130F]";
  return <div className={`flex items-center border ${surface}`} aria-label="Language switcher"><button onClick={() => setLanguage("en")} className={`px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${language === "en" ? "bg-[#C0632D] text-white" : ""}`}>EN</button><button onClick={() => setLanguage("ar")} className={`px-2 py-1 text-[10px] font-bold ${language === "ar" ? "bg-[#C0632D] text-white" : ""}`}>ع</button></div>;
}

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { state, cartCount, markNotificationsRead } = useStore();
  const [, setLocation] = useLocation();
  const unseen = state.notifications.filter((item) => item.audience === "customer" && !item.read).length;
  const results = useMemo(() => search.trim() ? state.products.filter((item) => `${item.name} ${item.brand} ${item.categoryId}`.toLowerCase().includes(search.toLowerCase())).slice(0, 4) : [], [search, state.products]);

  return <div className="min-h-screen overflow-x-hidden bg-[#FAF6F0] pb-16 text-[#17130F] md:pb-0">
    <div className="relative z-40 overflow-hidden bg-[#17130F] py-2 text-center text-[10px] font-bold uppercase tracking-[0.17em] text-[#FAF6F0]">
      <div className="animate-[pulse_4s_ease-in-out_infinite]">Copper hours: complimentary delivery over $300 <span className="mx-3 text-[#D9A441]">✦</span> The counter is open</div>
    </div>
    <header className="sticky top-0 z-40 border-b border-[#E6D7C7] bg-[#FAF6F0]/95 backdrop-blur-xl">
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <div className="flex items-center gap-3 lg:w-[32%]">
          <button className="inline-flex p-2 lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
          <Wordmark />
        </div>
        <nav className="hidden items-center gap-7 text-xs font-bold uppercase tracking-[0.13em] lg:flex">
          <Link href="/shop" className="transition hover:text-[#C0632D]">Shop tools</Link>
          <Link href="/deals" className="transition hover:text-[#C0632D]">Copper deals</Link>
          <Link href="/track" className="transition hover:text-[#C0632D]">Track order</Link>
          <a href="#journal" className="transition hover:text-[#C0632D]">Journal</a>
        </nav>
        <div className="flex items-center justify-end gap-1 lg:w-[32%]">
          <LanguageToggle />
          <button onClick={() => setSearchOpen(true)} className="inline-flex h-10 w-10 items-center justify-center transition hover:bg-[#F1E9DD]" aria-label="Search the shop"><Search size={19} /></button>
          <button onClick={() => { markNotificationsRead("customer"); setLocation("/track"); }} className="relative inline-flex h-10 w-10 items-center justify-center transition hover:bg-[#F1E9DD]" aria-label="View customer notifications"><Bell size={18} />{unseen > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C0632D]" />}</button>
          <button onClick={() => setCartOpen(true)} className="relative inline-flex h-10 items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-[#F1E9DD]" aria-label="Open cart"><ShoppingBag size={18} /><span className="hidden sm:inline">Bag</span>{cartCount > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-[#C0632D] text-[9px] text-white">{cartCount}</span>}</button>
        </div>
      </div>
    </header>
    {children}
    <Footer />
    <MobileNav />
    <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    {searchOpen && <div className="fixed inset-0 z-50 bg-[#17130F]/50 p-4 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
      <div className="mx-auto mt-20 max-w-2xl bg-[#FFFDF9] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#E6D7C7] pb-3"><Search size={18} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the counter…" className="w-full bg-transparent text-lg outline-none placeholder:text-[#8B7D70]" /><button onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18} /></button></div>
        <div className="pt-3">{results.length ? results.map((item) => <button key={item.id} onClick={() => { setSearchOpen(false); setLocation(`/product/${item.id}`); }} className="flex w-full items-center gap-3 border-b border-[#F1E9DD] py-3 text-left last:border-0 hover:text-[#C0632D]"><img src={item.image} alt="" className="h-12 w-12 object-cover" /><span><b className="block font-['Fraunces']">{item.name}</b><small className="uppercase tracking-[0.14em]">{item.brand} · ${item.price}</small></span></button>) : <p className="py-8 text-sm text-[#73675E]">Name an appliance, a maker or a kitchen ritual.</p>}</div>
      </div>
    </div>}
  </div>;
}

function Footer() {
  return <footer className="border-t border-[#3D3127] bg-[#17130F] text-[#FAF6F0]">
    <div className="container grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr_1.25fr]">
      <div><Wordmark dark /><p className="mt-5 max-w-xs text-sm leading-6 text-[#CDBFB2]">Considered tools for the well-used kitchen. Chosen for their work, not their noise.</p><Link href="/admin" className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441] hover:text-white"><ChefHat size={13} /> Atelier desk</Link></div>
      <div><p className="eyebrow !text-[#D9A441]">The counter</p><div className="mt-4 grid gap-3 text-sm text-[#E8DCD1]"><Link href="/shop">All appliances</Link><Link href="/deals">Copper deals</Link><Link href="/track">Track your order</Link></div></div>
      <div><p className="eyebrow !text-[#D9A441]">Assistance</p><div className="mt-4 grid gap-3 text-sm text-[#E8DCD1]"><a href="#care">Care & repairs</a><a href="#delivery">Delivery notes</a><a href="#contact">Talk to the kitchen</a></div></div>
      <div><p className="eyebrow !text-[#D9A441]">A note from the counter</p><p className="mt-4 text-sm leading-6 text-[#E8DCD1]">Quiet product notes, useful recipes and occasional copper savings.</p><div className="mt-4 flex border-b border-[#6A5543] pb-2"><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9D8B7C]" placeholder="Your email" /><button className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D9A441]">Join</button></div></div>
    </div>
    <div className="border-t border-[#3D3127] py-4 text-center text-[10px] uppercase tracking-[0.13em] text-[#907F72]">© 2026 Our Kitchen · Copper &amp; Co.</div>
  </footer>;
}

function MobileNav() {
  const [location] = useLocation();
  const entries = [{ href: "/", label: "Home" }, { href: "/shop", label: "Shop" }, { href: "/deals", label: "Deals" }, { href: "/track", label: "Orders" }];
  return <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-[#E6D7C7] bg-[#FFFDF9] py-2 md:hidden">{entries.map((entry) => <Link key={entry.href} href={entry.href} className={`px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] ${location === entry.href ? "text-[#C0632D]" : "text-[#73675E]"}`}>{entry.label}</Link>)}</nav>;
}
