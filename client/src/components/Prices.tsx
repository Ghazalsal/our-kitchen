/** Sale price beside its struck original, and order discounts read as a percentage first. */
import { formatILS } from "@/lib/money";

export function StruckPrice({ price, was, className = "" }: { price: number; was?: number; className?: string }) {
  return <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}><b className={was ? "text-[#8A4A27]" : ""}>{formatILS(price)}</b>{was && <span className="text-[0.8em] font-normal text-[#8B7D70] line-through">{formatILS(was)}</span>}</span>;
}

export function PercentDiscount({ percentOff, amount }: { percentOff: number; amount: number }) {
  return <span><b>−{percentOff}%</b> <span className="text-xs text-[#73675E]">(−{formatILS(amount)})</span></span>;
}
