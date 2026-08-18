/** Copperline Atelier product card: crisp product facts framed by an editorial crop and copper action. */
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useStore } from "@/contexts/StoreContext";
import type { Product } from "@/lib/types";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart } = useStore();
  const savings = product.compareAt ? product.compareAt - product.price : 0;
  return <article className="group reveal" style={{ animationDelay: `${index * 45}ms` }}>
    <Link href={`/product/${product.id}`} className="relative block aspect-[4/4.5] overflow-hidden bg-[#E9DCCD]"><img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" />{product.badge && <span className="absolute left-3 top-3 bg-[#FFFDF9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8A4A27]">{product.badge}</span>}<span className="absolute right-3 top-3 grid h-8 w-8 place-items-center bg-[#17130F] text-[#FAF6F0] opacity-0 transition duration-200 group-hover:opacity-100"><ArrowUpRight size={16} /></span></Link>
    <div className="border-x border-b border-[#E6D7C7] bg-[#FFFDF9] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8A4A27]">{product.brand}</p><Link href={`/product/${product.id}`}><h3 className="mt-1 text-xl leading-5 transition group-hover:text-[#C0632D]">{product.name}</h3></Link></div><button onClick={() => { addToCart(product.id, product.colors[0]); toast.success(`${product.name} is on the counter.`); }} className="mt-0.5 grid h-8 w-8 place-items-center border border-[#17130F] transition hover:border-[#C0632D] hover:bg-[#C0632D] hover:text-white" aria-label={`Add ${product.name} to bag`}><ShoppingBag size={15} /></button></div><div className="mt-4 flex items-center gap-2 text-sm"><b>${product.price}</b>{product.compareAt && <span className="text-[#8B7D70] line-through">${product.compareAt}</span>}{savings > 0 && <span className="ml-auto text-[9px] font-bold uppercase tracking-[0.12em] text-[#8A4A27]">Save ${savings}</span>}</div></div>
  </article>;
}
