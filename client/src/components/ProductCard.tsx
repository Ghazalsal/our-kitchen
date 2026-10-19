/** Copperline Atelier product card: crisp product facts framed by an editorial crop and copper action. */
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useStore } from "@/contexts/StoreContext";
import { formatILS, offerLabel } from "@/lib/money";
import type { Product } from "@/lib/types";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart, productPricing } = useStore();
  const { price, was, percentOff, offer } = productPricing(product);
  return <article className="group reveal flex h-full flex-col" style={{ animationDelay: `${index * 45}ms` }}>
    <Link href={`/product/${product.id}`} className="relative block aspect-[4/4.5] shrink-0 overflow-hidden bg-[#E9DCCD]"><img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" />{(product.badge || percentOff > 0 || offer) && <span className="absolute left-3 top-3 flex flex-col items-start gap-1.5">{percentOff > 0 && <span className="bg-[#C0632D] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Save {percentOff}%</span>}{offer && <span className="bg-[#17130F] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#FAF6F0]">{offerLabel(offer)}</span>}{product.badge && <span className="bg-[#FFFDF9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8A4A27]">{product.badge}</span>}</span>}<span className="absolute right-3 top-3 grid h-8 w-8 place-items-center bg-[#17130F] text-[#FAF6F0] opacity-0 transition duration-200 group-hover:opacity-100"><ArrowUpRight size={16} /></span></Link>
    <div className="flex flex-1 flex-col border-x border-b border-[#E6D7C7] bg-[#FFFDF9] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8A4A27]">{product.brand}</p><Link href={`/product/${product.id}`}><h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-xl leading-5 transition group-hover:text-[#C0632D]">{product.name}</h3></Link></div><button onClick={() => { addToCart(product.id, product.colors[0]); toast.success(`${product.name} is on the counter.`); }} className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center border border-[#17130F] transition hover:border-[#C0632D] hover:bg-[#C0632D] hover:text-white" aria-label={`Add ${product.name} to bag`}><ShoppingBag size={15} /></button></div><div className="mt-auto flex items-center gap-2 pt-4 text-sm"><b className={was ? "text-[#8A4A27]" : ""}>{formatILS(price)}</b>{was && <span className="text-[#8B7D70] line-through">{formatILS(was)}</span>}{was && <span className="ml-auto text-[9px] font-bold uppercase tracking-[0.12em] text-[#8A4A27]">Save {formatILS(was - price)}</span>}</div>{offer && offer.minSpend > 0 && <p className="mt-1.5 text-[11px] text-[#73675E]">On orders over {formatILS(offer.minSpend)}</p>}</div>
  </article>;
}
