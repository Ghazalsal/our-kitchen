/** Copperline Atelier deals: discounted goods receive their own crisp editorial room rather than cluttering the catalogue. */
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { StorefrontShell } from "@/components/StorefrontShell";
import { useStore } from "@/contexts/StoreContext";

export default function Deals() {
  const { state } = useStore();
  const deals = state.products.filter((product) => product.deal || product.compareAt);
  return <StorefrontShell><main><section className="bg-[#17130F] py-16 text-[#FAF6F0] md:py-24"><div className="container grid gap-8 md:grid-cols-[1.2fr_0.8fr]"><div><p className="eyebrow !text-[#D9A441]">The copper ledger</p><h1 className="mt-4 max-w-2xl text-5xl leading-[0.9] tracking-[-0.06em] md:text-7xl">Good tools, a little more within reach.</h1></div><div className="self-end border-l border-[#D9A441] pl-5 text-sm leading-6 text-[#E8DCD1]"><Sparkles size={19} className="mb-3 text-[#D9A441]" />A short-lived edit from the pantry shelf—current prices, no noise, every tool ready for use.</div></div></section><section className="container py-16 md:py-20"><div className="flex items-end justify-between gap-6"><div><p className="eyebrow">Currently on the ledger</p><h2 className="mt-2 text-4xl">Copper savings with a purpose.</h2></div><Link href="/shop" className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8A4A27] sm:inline-flex">All tools <ArrowUpRight size={15} /></Link></div><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{deals.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div></section></main></StorefrontShell>;
}
