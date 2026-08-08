"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, Leaf, Package, ShieldCheck, Star, Store, Wheat } from "lucide-react";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import SectionHead from "../components/SectionHead";
import { categoryImage, loadCategories, loadHeroSlides, loadHomeSettings, loadProducts } from "../lib/store";

const fallbackHomeSlides = [
  {
    eyebrow: "Organic products",
    title: "Clean staples for daily Indian cooking",
    body: "Naturally sourced rice, jaggery, pulses, spices and pantry basics selected for freshness, taste and everyday usefulness.",
    link: "/products?category=organic-staples",
    cta: "Shop organic staples",
    tone: "from-[#f7f0df] via-[#e9f1df] to-[#f5dcc1]",
    image: "/slide-organic-products.png",
    highlights: ["Rice and pulses", "Natural jaggery", "Farm-style staples"]
  },
  {
    eyebrow: "Dry fruits",
    title: "Premium cashews, almonds and festive mixes",
    body: "Creamy whole cashews, crunchy almonds, raisins and dry fruit blends for snacking, gifting and traditional sweets.",
    link: "/products?category=dry-fruits",
    cta: "Shop dry fruits",
    tone: "from-[#fff4dc] via-[#f5e6c8] to-[#ead3aa]",
    image: "/slide-dry-fruits.png",
    highlights: ["Whole cashews", "Gift-ready mixes", "Freshly packed"]
  },
  {
    eyebrow: "Cold pressed oils",
    title: "Wood-pressed oils with natural character",
    body: "Small-batch groundnut, sesame and coconut oils made for tadka, chutneys, pickles and everyday home cooking.",
    link: "/products?category=cold-pressed-oils",
    cta: "Shop cold pressed oils",
    tone: "from-[#fff8d8] via-[#f2e2a8] to-[#d9c06f]",
    image: "/slide-cold-pressed-oils.png",
    highlights: ["Groundnut oil", "Sesame oil", "No refined blends"]
  },
  {
    eyebrow: "Mitti products",
    title: "Terracotta cookware and cooling waterware",
    body: "Clay handis, tawa, curd pots, water bottles and matkas shaped for slow cooking, natural cooling and earthy table service.",
    link: "/products?category=mitti-cookware",
    cta: "Shop mitti products",
    tone: "from-[#f3dfc4] via-[#e2b98d] to-[#b86b42]",
    image: "/slide-mitti-products.png",
    highlights: ["Clay handi", "Water matka", "Curd pots"]
  }
];

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slides, setSlides] = useState(fallbackHomeSlides);
  const [homeSettings, setHomeSettings] = useState({showcaseCategoryId:null});
  const [slide, setSlide] = useState(0);
  const activeSlide = { ...slides[slide], slides };
  const showcaseCategory = categories.find((c) => c.id === homeSettings.showcaseCategoryId) || categories.find((c) => c.slug === "mitti-cookware") || categories.find((c) => products.some((p) => p.category?.id === c.id));
  const showcaseProducts = showcaseCategory ? products.filter((p) => p.category?.id === showcaseCategory.id).slice(0, 4) : [];
  useEffect(() => { loadProducts("/products").then(setProducts); loadCategories().then(setCategories); loadHomeSettings().then(setHomeSettings).catch(()=>{}); loadHeroSlides().then((items)=>{ if(items.length) setSlides(items); }).catch(()=>{}); }, []);
  useEffect(() => {
    const timer = setInterval(() => setSlide((current) => (current + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [slides.length]);
  return <main>
    <HeroSlider slide={slide} activeSlide={activeSlide}/>

    <section className="border-b border-forest/10 bg-white py-7"><div className="container-site grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[
      [Leaf,"Natural clay craft","Hand-finished kitchenware"],[ShieldCheck,"Clean pantry","No needless additives"],[Package,"Freshly packed","Small batches, careful handling"],[Clock3,"Tradition first","Millets, cashews and clay"]
    ].map(([I,t,d])=><div key={t} className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-cream text-leaf"><I size={20}/></span><div><strong className="text-sm text-forest">{t}</strong><p className="text-xs text-ink/50">{d}</p></div></div>)}</div></section>

    <section className="container-site py-20">
      <SectionHead eyebrow="Shop by range" title="Goodness, thoughtfully gathered" body="Inspired by traditional Indian kitchens: clay handis and water pots, premium cashews, ancient millets, spices, oils and daily staples." link="/products"/>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">{categories.map((c)=><Link key={c.id} to={`/products?category=${c.slug}`} className="group overflow-hidden rounded-[1.5rem] border border-forest/10 bg-white transition hover:-translate-y-1 hover:shadow-soft"><img src={categoryImage(c)} alt={c.name} className="aspect-[4/3] w-full bg-oat object-cover transition duration-500 group-hover:scale-105" onError={e=>e.currentTarget.src="/samruddhi-hero.png"}/><div className="p-4"><h3 className="text-lg leading-tight text-forest">{c.name}</h3></div></Link>)}</div>
    </section>

    {showcaseProducts.length > 0 && <section className="bg-white py-20"><div className="container-site">
      <SectionHead eyebrow={showcaseCategory.name} title={`${showcaseCategory.name} products`} body={showcaseCategory.description || "Fresh products from the current catalogue, loaded directly from your database."} link={`/products?category=${showcaseCategory.slug}`}/>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{showcaseProducts.map((p)=><ProductCard key={p.id} product={p}/>)}</div>
    </div></section>}

    <section className="bg-[#f0eadc] py-20"><div className="container-site"><SectionHead eyebrow="Loved by households" title="Pantry favourites" body="Fresh picks our community returns to, week after week." link="/products?sort=bestsellers"/><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.filter(p=>p.bestseller).slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div></div></section>

    <section className="container-site py-20">
      <div className="grid overflow-hidden rounded-[2rem] bg-forest lg:grid-cols-2">
        <div className="p-9 text-white md:p-14"><p className="eyebrow !text-[#f3c85d]">Ancient grains, everyday ease</p><h2 className="mt-3 text-4xl md:text-5xl">Make room for mighty millets.</h2><p className="mt-5 max-w-lg leading-7 text-white/70">Nutritious, climate-friendly and wonderfully versatile. Reimagine familiar meals with foxtail, little, barnyard and kodo millet.</p><Link to="/products?category=millets" className="mt-8 inline-flex items-center gap-2 border-b border-white pb-1 text-sm font-bold">Explore millets <ArrowRight size={16}/></Link></div>
        <div className="relative min-h-80"><img src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85" alt="Wholesome millets and grains" className="absolute inset-0 h-full w-full object-cover"/></div>
      </div>
    </section>

    <section className="container-site py-20"><SectionHead eyebrow="Why Samruddhi" title="Simple promises, kept well"/><div className="grid gap-5 md:grid-cols-3">{[
      [Wheat,"Farm-sourced quality","We work with trusted growers and makers who value soil, season and honest craft."],
      [Leaf,"Naturally better","A pantry built around pure ingredients, ancient grains and minimal processing."],
      [Store,"Indian kitchen wisdom","Traditional ingredients and vessels chosen for the way our homes really cook."]
    ].map(([I,t,d])=><div key={t} className="rounded-[1.75rem] border border-forest/10 bg-white p-8"><I className="text-clay" size={30}/><h3 className="mt-7 text-2xl text-forest">{t}</h3><p className="mt-3 text-sm leading-6 text-ink/55">{d}</p></div>)}</div></section>

    {/* <section className="bg-oat py-20"><div className="container-site"><SectionHead eyebrow="Kind words" title="From kitchens like yours"/><div className="grid gap-5 md:grid-cols-3">{[
      ["The cashews were genuinely fresh and creamy. Even the packaging felt thoughtful.","Ananya Rao","Bengaluru"],
      ["My clay handi has changed Sunday dal entirely—slow, earthy and worth the little ritual.","Meera Kulkarni","Pune"],
      ["Millets that are clean, easy to cook and actually taste lovely. I keep coming back.","Rohan Shah","Mumbai"]
    ].map(([q,n,c])=><blockquote key={n} className="rounded-[1.75rem] bg-white p-7"><div className="flex text-turmeric">{[1,2,3,4,5].map(i=><Star key={i} size={15} fill="currentColor"/>)}</div><p className="mt-5 font-display text-xl leading-8 text-forest">“{q}”</p><footer className="mt-6 text-xs"><strong>{n}</strong><span className="text-ink/45"> · {c}</span></footer></blockquote>)}</div></div></section> */}

    {/* <Newsletter/> */}
  </main>;
}

// function Newsletter() {
//   const [done,setDone]=useState(false);
//   return <section className="container-site py-20"><div className="relative overflow-hidden rounded-[2rem] bg-clay px-7 py-14 text-center text-white md:px-14"><Leaf className="absolute -left-10 -top-10 h-40 w-40 rotate-12 text-white/5"/><p className="text-xs font-bold uppercase tracking-[.22em] text-oat">A little goodness in your inbox</p><h2 className="mt-3 text-3xl md:text-4xl">Recipes, rituals & fresh arrivals.</h2><p className="mx-auto mt-3 max-w-lg text-sm text-white/70">Join our table for practical millet recipes, clay-pot care and member-only offers.</p>{done?<p className="mt-7 font-bold">You’re on the list. Welcome to the table!</p>:<form onSubmit={(e)=>{e.preventDefault();setDone(true)}} className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row"><input required type="email" className="min-w-0 flex-1 rounded-full bg-white px-5 py-3 text-sm text-ink" placeholder="Your email address"/><button className="rounded-full bg-forest px-6 py-3 text-sm font-bold">Subscribe</button></form>}</div></section>;
// }

export default Home;
