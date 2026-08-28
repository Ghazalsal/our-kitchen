/** Copperline Atelier tracking: a transparent status journey paired with a two-way order conversation. */
import { Check, ChevronRight, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { StorefrontShell } from "@/components/StorefrontShell";
import { useStore } from "@/contexts/StoreContext";
import { formatILS } from "@/lib/money";
import type { OrderStatus } from "@/lib/types";

const stages: OrderStatus[] = ["placed", "confirmed", "preparing", "shipped", "delivered"];

export default function Track() {
  const { state, sendMessage, markNotificationsRead } = useStore();
  const [orderId, setOrderId] = useState(state.orders[0]?.id ?? "");
  const [query, setQuery] = useState(orderId);
  const [message, setMessage] = useState("");
  const order = state.orders.find((item) => item.id.toLowerCase() === orderId.toLowerCase());
  const thread = state.messages.filter((item) => item.orderId === order?.id);
  const locate = () => { setOrderId(query); markNotificationsRead("customer"); };
  const send = () => { if (!order || !message.trim()) return; sendMessage(order.id, "customer", message.trim()); setMessage(""); };
  return <StorefrontShell><main className="container py-10 md:py-16"><p className="eyebrow">Order tracking</p><h1 className="mt-3 text-5xl tracking-[-0.055em] md:text-6xl">Where the counter is now.</h1><div className="mt-8 flex max-w-xl border-b border-[#BFAE9E] pb-2"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && locate()} placeholder="Order number e.g. CK-18042" className="min-w-0 flex-1 bg-transparent text-lg uppercase outline-none placeholder:text-[#8B7D70]" /><button onClick={locate} className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A4A27]">Find order</button></div>{!order ? <div className="paper-panel mt-8 max-w-xl p-8"><h2 className="text-3xl">We can’t find that order yet.</h2><p className="mt-2 text-sm text-[#73675E]">Try the number from your confirmation. For this demo, use {state.orders[0]?.id}.</p></div> : <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.72fr]"><section><div className="paper-panel p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">{order.id}</p><h2 className="mt-2 text-4xl">In the kitchen.</h2></div><span className="stamp border-[#687C5D] text-[#526349]">{order.status}</span></div><p className="mt-4 text-sm leading-6 text-[#5B4E44]">Placed {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })} for {formatILS(order.total)}.</p><div className="mt-12">
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-[#E6D7C7]" />
                    <div 
                      className="absolute left-0 top-1/2 h-0.5 bg-[#C0632D] transition-all duration-1000" 
                      style={{ width: `${(stages.indexOf(order.status) / (stages.length - 1)) * 100}%` }} 
                    />
                    <div className="relative flex justify-between">
                      {stages.map((stage, index) => {
                        const currentIdx = stages.indexOf(order.status);
                        const isDone = index <= currentIdx;
                        const isCurrent = index === currentIdx;
                        return (
                          <div key={stage} className="flex flex-col items-center">
                            <div className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border-4 bg-[#FFFDF9] transition-colors duration-500 ${isDone ? "border-[#C0632D]" : "border-[#E6D7C7]"}`}>
                              {isDone ? (
                                <Check size={18} className="text-[#C0632D]" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-[#D7C6B6]" />
                              )}
                              {isCurrent && (
                                <span className="absolute inset-0 animate-ping rounded-full bg-[#C0632D]/20" />
                              )}
                            </div>
                            <span className={`mt-4 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${isDone ? "text-[#17130F]" : "text-[#8B7D70]"}`}>
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div></div><div className="mt-6 paper-panel p-6"><p className="eyebrow">What’s on the order</p><div className="mt-4 grid gap-4">{order.lines.map((line) => <div key={`${line.productId}-${line.color}`} className="flex items-center gap-4"><img src={line.image} alt="" className="h-16 w-14 object-cover" /><div className="flex-1"><b className="font-['Fraunces'] text-lg">{line.name}</b><p className="text-xs text-[#73675E]">{line.quantity} × {line.color}</p></div><b>{formatILS(line.price * line.quantity)}</b></div>)}</div><div className="mt-5 border-t border-[#E6D7C7] pt-4 text-sm text-[#5B4E44]"><b className="block text-[#17130F]">Delivering to</b>{order.address}</div></div></section><aside className="paper-panel flex min-h-[430px] flex-col p-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center bg-[#17130F] text-[#D9A441]"><MessageCircle size={18} /></span><div><p className="eyebrow">The atelier desk</p><h2 className="font-['Fraunces'] text-xl">Ask the kitchen.</h2></div></div><div className="mt-5 flex-1 space-y-3">{thread.length ? thread.map((item) => <div key={item.id} className={`max-w-[88%] p-3 text-sm leading-5 ${item.sender === "customer" ? "ml-auto bg-[#17130F] text-[#FAF6F0]" : "border border-[#E6D7C7] bg-[#F7F0E7]"}`}><p>{item.body}</p><small className={`mt-1 block text-[9px] uppercase tracking-[0.12em] ${item.sender === "customer" ? "text-[#CDBFB2]" : "text-[#8B7D70]"}`}>{item.sender === "customer" ? "You" : "Atelier desk"}</small></div>) : <p className="pt-8 text-sm text-[#73675E]">Start a note if the kitchen can help with this order.</p>}</div><div className="mt-5 flex gap-2 border-t border-[#E6D7C7] pt-4"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Write a note…" /><button onClick={send} className="grid h-9 w-9 place-items-center bg-[#C0632D] text-white" aria-label="Send message"><Send size={15} /></button></div></aside></div>}</main></StorefrontShell>;
}
