/** Copperline Atelier home: an editorial procession from campaign hero to tactile product discovery. */
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { StorefrontShell, useDealsGuard } from "@/components/StorefrontShell";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/contexts/StoreContext";
import { formatILS } from "@/lib/money";

const hero = "/catalog/hero.webp";

export default function Home() {
  const { state } = useStore();
  const guardDeals = useDealsGuard();
  const dorshaEdit = state.products.filter((product) => product.brand === "Dorsha").slice(0, 4);
  const everydayEdit = state.products.filter((product) => !product.featured && product.brand !== "Dorsha").slice(0, 4);
  return <StorefrontShell>
    <main>
      <section className="relative min-h-[650px] overflow-hidden bg-[#17130F] text-[#FAF6F0] md:min-h-[720px]">
        <img src={hero} alt="Copper stand mixer on a kitchen worktop" className="absolute inset-0 h-full w-full object-cover object-[66%_center] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17130F] via-[#17130F]/82 to-[#17130F]/10" />
        <div className="container relative flex min-h-[650px] items-end pb-14 pt-24 md:min-h-[720px] md:pb-20">
          <div className="max-w-2xl reveal"><div className="flex items-center gap-3"><span className="h-px w-12 bg-[#D9A441]" /><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Where every good kitchen begins</span></div><h1 className="mt-6 max-w-xl text-5xl leading-[0.92] tracking-[-0.055em] md:text-7xl">Keep only the tools that <i className="font-normal text-[#E0A67B]">earn</i> their place.</h1><p className="mt-6 max-w-lg text-base leading-7 text-[#E8DCD1] md:text-lg">The appliances you reach for when a weekday meal becomes the best part of your day.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/shop" className="copper-button">Set your kitchen in motion <ArrowUpRight size={16} /></Link><Link href="/deals" onClick={guardDeals} className="inline-flex items-center gap-2 border border-[#FAF6F0]/40 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] transition hover:border-[#D9A441] hover:text-[#D9A441]">Browse deals</Link></div></div>
          <div className="absolute bottom-7 right-5 hidden w-40 border-l border-[#D9A441] pl-4 text-xs leading-5 text-[#E8DCD1] md:block"><b className="block text-[10px] uppercase tracking-[0.16em] text-[#D9A441]">01 / The workhorse</b><span className="mt-1 block">Tools chosen for a life in use.</span></div>
        </div>
      </section>

      <CampaignCountdown campaigns={state.campaigns} />

      <section className="py-16 md:py-24">
        <div className="container mb-10 flex items-end justify-between gap-6">
          <div><p className="eyebrow">Categories</p><h2 className="mt-3 text-4xl tracking-[-0.045em] md:text-5xl">Start shopping.</h2></div>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A4A27] hover:text-[#C0632D]">Browse all <ArrowUpRight size={15} className="inline" /></Link>
        </div>
        <div className="no-scrollbar flex gap-5 overflow-x-auto px-5 pb-4 md:px-[max(1.25rem,calc((100vw-1280px)/2))]">
          {state.categories.map((category, index) => {
            const count = state.products.filter((product) => product.categoryId === category.id).length;
            return <Link key={category.id} href={`/shop?category=${category.id}`} className="group reveal flex w-[280px] flex-shrink-0 flex-col md:w-[320px]" style={{ animationDelay: `${index * 45}ms` }}>
              <div className="relative aspect-[4/4.5] shrink-0 overflow-hidden bg-[#E9DCCD]">
                <img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17130F]/70 via-[#17130F]/10 to-transparent transition duration-300 group-hover:from-[#17130F]/80" />
                <span className="absolute left-3 top-3 bg-[#FFFDF9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#8A4A27]">{String(index + 1).padStart(2, "0")}</span>
                <p className="absolute inset-x-4 bottom-4 line-clamp-2 translate-y-2 text-xs leading-relaxed text-[#F5EEE5] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">{category.description}</p>
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 border-x border-b border-[#E6D7C7] bg-[#FFFDF9] p-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8A4A27]">{count} {count === 1 ? "piece" : "pieces"}</p>
                  <h3 className="mt-1 text-xl leading-5 transition group-hover:text-[#C0632D]">{category.name}</h3>
                </div>
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center border border-[#17130F] transition group-hover:border-[#C0632D] group-hover:bg-[#C0632D] group-hover:text-white"><ArrowUpRight size={15} /></span>
              </div>
            </Link>;
          })}
        </div>
      </section>

      {dorshaEdit.length > 0 && <section className="py-16 md:py-24">
        <div className="container mb-10 flex items-end justify-between gap-6">
          <div><p className="eyebrow">A tabletop edit</p><h2 className="mt-3 text-4xl tracking-[-0.045em] md:text-5xl">Dorsha, for the table.</h2></div>
          <Link href="/shop?brand=Dorsha" className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A4A27] hover:text-[#C0632D]">Tableware <ArrowUpRight size={15} className="inline" /></Link>
        </div>
        <div className="no-scrollbar flex gap-5 overflow-x-auto px-5 pb-4 md:px-[max(1.25rem,calc((100vw-1280px)/2))]">
          {dorshaEdit.map((product, index) => (
            <div key={product.id} className="w-[280px] flex-shrink-0 md:w-[320px]">
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>
      </section>}

      {everydayEdit.length > 0 && <section className="bg-[#EFE4D7] py-16 md:py-24">
        <div className="container mb-10 flex items-end justify-between gap-6">
          <div><p className="eyebrow">Newly on the counter</p><h2 className="mt-3 text-4xl tracking-[-0.045em] md:text-5xl">Everyday tools, well chosen.</h2></div>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A4A27] hover:text-[#C0632D]">See the full room <ArrowUpRight size={15} className="inline" /></Link>
        </div>
        <div className="container grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {everydayEdit.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>}
    </main>
  </StorefrontShell>;
}

function CampaignCountdown({ campaigns }: { campaigns: import("@/lib/types").Campaign[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const available = campaigns.filter((campaign) => campaign.enabled && new Date(campaign.endsAt).getTime() > now);
  const sortCampaigns = (items: typeof available) => items.sort((a, b) => b.priority - a.priority || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const active = sortCampaigns(available.filter((campaign) => new Date(campaign.startsAt).getTime() <= now))[0] ?? sortCampaigns(available.filter((campaign) => new Date(campaign.startsAt).getTime() > now))[0];
  if (!active) return null;
  const startsAt = new Date(active.startsAt).getTime(); const endsAt = new Date(active.endsAt).getTime(); const isLive = startsAt <= now; const remaining = Math.max(0, (isLive ? endsAt : startsAt) - now);
  const hours = Math.floor(remaining / 3_600_000); const minutes = Math.floor((remaining % 3_600_000) / 60_000); const seconds = Math.floor((remaining % 60_000) / 1_000);
  const offer = active.type === "percent" ? `${active.value}% off` : active.type === "fixed" ? `${formatILS(active.value)} off` : "Free delivery";
  return <section className="bg-[#C0632D] py-5 text-[#FFF9F3]"><div className="container flex flex-wrap items-center justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFE0C6]">{isLive ? "Live now" : "Coming soon"}</p><h2 className="mt-1 text-3xl leading-none md:text-4xl">{active.name} <span className="font-sans text-base font-bold">· {offer}</span></h2></div><div className="flex items-center gap-2 text-center"><TimeUnit value={hours} label="hours" /><span className="text-2xl">:</span><TimeUnit value={minutes} label="mins" /><span className="text-2xl">:</span><TimeUnit value={seconds} label="secs" /><span className="ml-2 text-xs font-bold uppercase tracking-[0.14em] text-[#FFE0C6]">{isLive ? "ends in" : "starts in"}</span></div><Link href="/shop" className="border border-[#FFE0C6]/80 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:bg-[#17130F] hover:border-[#17130F]">Shop the offer <ArrowUpRight size={14} className="inline" /></Link></div></section>;
}
function TimeUnit({ value, label }: { value: number; label: string }) { return <span><b className="block min-w-10 font-['Fraunces'] text-3xl leading-none tabular-nums">{String(value).padStart(2, "0")}</b><small className="mt-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-[#FFE0C6]">{label}</small></span>; }
