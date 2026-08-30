/** Copperline Atelier home: an editorial procession from campaign hero to tactile product discovery. */
import { ArrowDownRight, ArrowUpRight, Check, Mail, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { StorefrontShell } from "@/components/StorefrontShell";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/contexts/StoreContext";
import { formatILS } from "@/lib/money";

const hero = "/catalog/hero.webp";
const baking = "/catalog/baking.webp";

export default function Home() {
  const { state } = useStore();
  const featured = state.products.filter((product) => product.featured).slice(0, 4);
  const dorshaEdit = state.products.filter((product) => product.brand === "Dorsha").slice(0, 4);
  const deal = state.products.find((product) => product.id === "brine-oven") ?? state.products[0];
  return <StorefrontShell>
    <main>
      <section className="relative min-h-[650px] overflow-hidden bg-[#17130F] text-[#FAF6F0] md:min-h-[720px]">
        <img src={hero} alt="Copper stand mixer on a kitchen worktop" className="absolute inset-0 h-full w-full object-cover object-[66%_center] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17130F] via-[#17130F]/82 to-[#17130F]/10" />
        <div className="container relative flex min-h-[650px] items-end pb-14 pt-24 md:min-h-[720px] md:pb-20">
          <div className="max-w-2xl reveal"><div className="flex items-center gap-3"><span className="h-px w-12 bg-[#D9A441]" /><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">A better counter begins here</span></div><h1 className="mt-6 max-w-xl text-5xl leading-[0.92] tracking-[-0.055em] md:text-7xl">Make room for the tools that <i className="font-normal text-[#E0A67B]">earn</i> their place.</h1><p className="mt-6 max-w-lg text-base leading-7 text-[#E8DCD1] md:text-lg">The appliances you reach for when a weekday meal becomes the part of the day you keep.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/shop" className="copper-button">Set the counter in motion <ArrowUpRight size={16} /></Link><Link href="/deals" className="inline-flex items-center gap-2 border border-[#FAF6F0]/40 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] transition hover:border-[#D9A441] hover:text-[#D9A441]">See copper deals</Link></div></div>
          <div className="absolute bottom-7 right-5 hidden w-40 border-l border-[#D9A441] pl-4 text-xs leading-5 text-[#E8DCD1] md:block"><b className="block text-[10px] uppercase tracking-[0.16em] text-[#D9A441]">01 / The workhorse</b><span className="mt-1 block">Tools chosen for a life in use.</span></div>
        </div>
      </section>

      <CampaignCountdown campaigns={state.campaigns} />

      <section className="py-16 md:py-24">
        <div className="container mb-10 flex items-end justify-between gap-6">
          <div><p className="eyebrow">The collection</p><h2 className="mt-3 text-4xl tracking-[-0.045em] md:text-5xl">Start with the ritual.</h2></div>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A4A27] hover:text-[#C0632D]">Browse all <ArrowUpRight size={15} className="inline" /></Link>
        </div>
        <div className="no-scrollbar flex gap-5 overflow-x-auto px-5 pb-4 md:px-[max(1.25rem,calc((100vw-1280px)/2))]">
          {state.categories.map((category, index) => (
            <Link key={category.id} href={`/shop?category=${category.id}`} className="group relative min-w-[280px] flex-shrink-0 overflow-hidden md:min-w-[340px]">
              <div className="aspect-[4/5] overflow-hidden bg-[#E9DCCD]">
                <img src={category.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]" />
                <div className="image-wash opacity-40 group-hover:opacity-60" />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                <span className="stamp w-fit border-white/40 bg-black/10">0{index + 1}</span>
                <h3 className="mt-3 text-3xl font-['Fraunces'] leading-none">{category.name}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#F5EEE5] opacity-0 transition duration-300 group-hover:opacity-100">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#EFE4D7] py-16 md:py-24">
        <div className="container mb-10 flex items-end justify-between gap-6">
          <div><p className="eyebrow">Most reached for</p><h2 className="mt-3 text-4xl tracking-[-0.045em] md:text-5xl">Good tools, in use.</h2></div>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A4A27] hover:text-[#C0632D]">Shop tools <ArrowUpRight size={15} className="inline" /></Link>
        </div>
        <div className="no-scrollbar flex gap-5 overflow-x-auto px-5 pb-4 md:px-[max(1.25rem,calc((100vw-1280px)/2))]">
          {featured.map((product, index) => (
            <div key={product.id} className="w-[280px] flex-shrink-0 md:w-[320px]">
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#17130F] py-20 text-[#FAF6F0] md:py-32">
        <div className="container grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="lg:pr-12">
            <p className="eyebrow !text-[#D9A441]">The slow heat edit</p>
            <h2 className="mt-4 text-5xl leading-[0.92] tracking-[-0.045em] md:text-6xl">An oven that knows a small meal can still be an occasion.</h2>
            <p className="mt-7 max-w-md text-base leading-7 text-[#CDBFB2]">The Brine countertop oven carries a proper roast, a small loaf, or the cheese-on-toast that turns dinner around.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href={`/product/${deal.id}`} className="copper-button">Meet the Brine <ArrowDownRight size={16} /></Link>
              <div className="flex items-center gap-3 border-l border-[#D9A441]/40 pl-5">
                <span className="font-['Fraunces'] text-3xl">{formatILS(deal.price)}</span>
                {deal.compareAt && <span className="text-sm text-[#8B7D70] line-through">{formatILS(deal.compareAt)}</span>}
              </div>
            </div>
          </div>
          <div className="relative aspect-video overflow-hidden bg-[#211a15] md:aspect-[1.4/1]">
            <img src={baking} alt="Brass countertop oven" className="h-full w-full object-cover opacity-90 transition duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17130F]/40 to-transparent" />
          </div>
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

      <section className="border-y border-[#E6D7C7] bg-[#FFFDF9]">
        <div className="container grid divide-y divide-[#E6D7C7] md:grid-cols-3 md:divide-x md:divide-y-0">
          <Trust icon={<Truck />} title="Counter-to-door delivery" body={`Complimentary delivery when the order settles over ${formatILS(300)}.`} />
          <Trust icon={<ShieldCheck />} title="Two years of care" body="Thoughtful support after the box leaves our kitchen." />
          <Trust icon={<Sparkles />} title="Chosen, not crowded" body="A considered collection that knows its place on the counter." />
        </div>
      </section>

      <section id="journal" className="bg-[#17130F] py-16 text-[#FAF6F0] md:py-24">
        <div className="container grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow !text-[#D9A441]">From the kitchen book</p>
            <h2 className="mt-3 max-w-lg text-4xl leading-[0.96] tracking-[-0.045em] md:text-5xl">Useful notes for the counter you actually use.</h2>
          </div>
          <div className="border-l border-[#D9A441] pl-6">
            <p className="text-base leading-7 text-[#E8DCD1]">Monthly recipes, care notes and the occasional small saving—written with the expectation that you already know your way around a good pan.</p>
            <div className="mt-6 flex max-w-md border-b border-[#786858] pb-2">
              <Mail size={16} className="mr-3 text-[#D9A441]" />
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#BBAA9C]" placeholder="Email for the kitchen book" />
              <button className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Subscribe</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </StorefrontShell>;
}

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="flex gap-4 px-0 py-6 md:px-7 md:py-8"><span className="mt-0.5 text-[#C0632D]">{icon}</span><div><h3 className="font-['Fraunces'] text-xl">{title}</h3><p className="mt-1 text-sm leading-5 text-[#73675E]">{body}</p></div></div>;
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
