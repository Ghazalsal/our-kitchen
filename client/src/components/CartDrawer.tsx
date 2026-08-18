/** Copperline Atelier cart drawer: a fast, transparent bag review built for decisive checkout. */
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useLocation } from "wouter";
import { useStore } from "@/contexts/StoreContext";
import { formatILS } from "@/lib/money";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, cartSubtotal, updateQuantity, removeFromCart } = useStore();
  const [, setLocation] = useLocation();
  if (!open) return null;
  const lines = state.cart.map((line) => ({ ...line, product: state.products.find((product) => product.id === line.productId)! })).filter((line) => line.product);
  return <div className="fixed inset-0 z-50 bg-[#17130F]/45 backdrop-blur-sm" onClick={onClose}>
    <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-[#FFFDF9] shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[#E6D7C7] p-5"><div><p className="eyebrow">The bag</p><h2 className="mt-1 text-2xl">Set the counter.</h2></div><button onClick={onClose} className="p-2" aria-label="Close bag"><X size={21} /></button></div>
      <div className="flex-1 overflow-y-auto p-5">{!lines.length ? <div className="grid place-items-center pt-24 text-center"><ShoppingBag size={28} className="text-[#C0632D]" /><h3 className="mt-4 text-2xl">Nothing on the counter.</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#73675E]">Your next good kitchen tool is waiting in the shop.</p><button onClick={() => { onClose(); setLocation("/shop"); }} className="ink-button mt-6">Browse tools</button></div> : <div className="grid gap-5">{lines.map(({ product, ...line }) => <article key={`${line.productId}-${line.color}`} className="flex gap-4 border-b border-[#E6D7C7] pb-5"><img src={product.image} alt={product.name} className="h-24 w-20 object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-['Fraunces'] text-lg leading-5">{product.name}</h3><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A4A27]">{line.color}</p></div><button onClick={() => removeFromCart(line.productId, line.color)} aria-label={`Remove ${product.name}`} className="text-[#8B7D70] hover:text-[#C0632D]"><Trash2 size={16} /></button></div><div className="mt-4 flex items-center justify-between"><div className="flex items-center border border-[#E6D7C7]"><button onClick={() => updateQuantity(line.productId, line.color, line.quantity - 1)} className="p-1.5"><Minus size={14} /></button><span className="w-7 text-center text-xs font-bold">{line.quantity}</span><button onClick={() => updateQuantity(line.productId, line.color, line.quantity + 1)} className="p-1.5"><Plus size={14} /></button></div><b className="text-sm">{formatILS(product.price * line.quantity)}</b></div></div></article>)}</div>}</div>
      {lines.length > 0 && <div className="border-t border-[#E6D7C7] bg-[#F5EEE5] p-5"><div className="flex items-end justify-between"><span className="text-xs font-bold uppercase tracking-[0.13em]">Subtotal</span><b className="font-['Fraunces'] text-2xl">{formatILS(cartSubtotal)}</b></div><p className="mt-1 text-xs text-[#73675E]">Delivery is calculated at checkout.</p><button onClick={() => { onClose(); setLocation("/checkout"); }} className="copper-button mt-4 w-full">Continue to checkout</button></div>}
    </aside>
  </div>;
}
