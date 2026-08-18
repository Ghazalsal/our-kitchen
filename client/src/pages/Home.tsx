/** Copperline Atelier home: an editorial procession from campaign hero to tactile product discovery. */
import { ArrowDownRight, ArrowUpRight, Check, Mail, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Link } from "wouter";
import { StorefrontShell } from "@/components/StorefrontShell";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/contexts/StoreContext";
import { formatILS } from "@/lib/money";

const hero = "/manus-storage/our-kitchen-hero_5efbd6f3.jpg";
const baking = "/manus-storage/our-kitchen-baking_12b30794.jpg";

export default function Home() {
  const { state } = useStore();
  const featured = state.products.filter((product) => product.featured).slice(0, 4);
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

      <section className="border-b border-[#E6D7C7] bg-[#FFFDF9]"><div className="container grid divide-y divide-[#E6D7C7] md:grid-cols-3 md:divide-x md:divide-y-0"><Trust icon={<Truck />} title="Counter-to-door delivery" body={`Complimentary delivery when the order settles over ${formatILS(300)}.`} /><Trust icon={<ShieldCheck />} title="Two years of care" body="Thoughtful support after the box leaves our kitchen." /><Trust icon={<Sparkles />} title="Chosen, not crowded" body="A considered collection that knows its place on the counter." /></div></section>

      <section className="container py-20 md:py-28"><div className="flex items-end justify-between gap-6"><div><p className="eyebrow">Start with the ritual</p><h2 className="mt-3 text-4xl tracking-[-0.045em] md:text-5xl">Find your kitchen’s<br />next good habit.</h2></div><Link href="/shop" className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8A4A27] hover:text-[#C0632D] sm:inline-flex">All tools <ArrowUpRight size={15} /></Link></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{state.categories.map((category, index) => <Link key={category.id} href={`/shop?category=${category.id}`} className={`group relative min-h-72 overflow-hidden ${index === 0 ? "lg:mt-12" : index === 2 ? "lg:-mt-8" : ""}`}><img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]" /><div className="image-wash" /><div className="relative flex h-full min-h-72 flex-col justify-end p-5 text-white"><span className="stamp w-fit border-white/50 bg-black/10">0{index + 1}</span><h3 className="mt-3 text-3xl">{category.name}</h3><p className="mt-2 max-w-48 text-sm leading-5 text-[#F5EEE5]">{category.description}</p></div></Link>)}</div></section>

      <section className="relative overflow-hidden bg-[#EFE4D7] py-16 md:py-20"><div className="container grid items-center gap-10 lg:grid-cols-[1fr_1.25fr]"><div className="lg:pl-[10%]"><p className="eyebrow">The slow heat edit</p><h2 className="mt-3 max-w-sm text-4xl leading-[0.95] tracking-[-0.045em] md:text-5xl">An oven that knows a small meal can still be an occasion.</h2><p className="mt-5 max-w-md text-sm leading-6 text-[#5B4E44]">The Brine countertop oven carries a proper roast, a small loaf, or the cheese-on-toast that turns dinner around.</p><Link href={`/product/${deal.id}`} className="ink-button mt-7">Meet the Brine <ArrowDownRight size={16} /></Link></div><div className="relative min-h-80 overflow-hidden bg-[#17130F] md:min-h-[420px]"><img src={baking} alt="Brass countertop oven on a kitchen table" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute bottom-5 left-5 border-l border-[#D9A441] bg-[#17130F]/85 p-4 text-[#FAF6F0]"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Copper deal</span><p className="mt-1 font-['Fraunces'] text-2xl">{formatILS(deal.price)} {deal.compareAt && <span className="text-base text-[#CDBFB2] line-through">{formatILS(deal.compareAt)}</span>}</p></div></div></div></section>

      <section className="container py-20 md:py-28"><div className="grid items-end gap-5 md:grid-cols-[1fr_auto]"><div><p className="eyebrow">Most reached for</p><h2 className="mt-3 text-4xl tracking-[-0.045em] md:text-5xl">Good tools, in their element.</h2></div><p className="max-w-xs text-sm leading-6 text-[#73675E]">A short list of tried-and-ready appliances for a counter that sees real work.</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div></section>

      <section id="journal" className="bg-[#17130F] py-16 text-[#FAF6F0]"><div className="container grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]"><div><p className="eyebrow !text-[#D9A441]">From the kitchen book</p><h2 className="mt-3 max-w-lg text-4xl leading-[0.96] tracking-[-0.045em] md:text-5xl">Useful notes for the counter you actually use.</h2></div><div className="border-l border-[#D9A441] pl-6"><p className="text-base leading-7 text-[#E8DCD1]">Monthly recipes, care notes and the occasional small saving—written with the expectation that you already know your way around a good pan.</p><div className="mt-6 flex max-w-md border-b border-[#786858] pb-2"><Mail size={16} className="mr-3 text-[#D9A441]" /><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#BBAA9C]" placeholder="Email for the kitchen book" /><button className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Subscribe</button></div></div></div></section>
    </main>
  </StorefrontShell>;
}

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="flex gap-4 px-0 py-6 md:px-7 md:py-8"><span className="mt-0.5 text-[#C0632D]">{icon}</span><div><h3 className="font-['Fraunces'] text-xl">{title}</h3><p className="mt-1 text-sm leading-5 text-[#73675E]">{body}</p></div></div>;
}
