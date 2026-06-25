import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, ChevronDown, CircleUserRound, Clock3, Heart, Leaf, Menu, Minus, Package,
  Plus, Search, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Star, Store, Trash2, Truck,
  Wheat, X, Instagram, Facebook, Phone, Mail, MapPin, LayoutDashboard, LogOut, Pencil, Save
} from "lucide-react";
import { GrandOpeningPopup, OpeningCountdown } from "./components/GrandOpening";

const API = "/api";
const AppContext = createContext();
const money = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
const categoryIcons = { Cashews: "C", "Dry Fruits": "D", Millets: "M",  "Cold Pressed Oils": "P", "Natural Spices": "S", "Mitti Cookware": "M" };

async function request(path, options = {}) {
  const token = localStorage.getItem("samruddhi-token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Request failed");
  return res.status === 204 ? null : res.json();
}

const sampleCategoriesBase = [
  ["Cashews", "cashews"],
  ["Dry Fruits", "dry-fruits"],
  ["Millets", "millets"],
  ["Cold Pressed Oils", "cold-pressed-oils"],
  ["Natural Spices", "natural-spices"],
  ["Mitti Cookware", "mitti-cookware"]
].map(([name, slug], index) => ({ id: index + 1, name, slug, _count: { products: 0 } }));

const sampleCategory = (name) => sampleCategoriesBase.find((category) => category.name === name);
const sampleProducts = [
  ["Premium Whole Cashews W320", "Cashews", 749, 679, "500 g", 42, true, true, "Large, creamy W320 cashews with a naturally sweet finish.", "/products/cashews-w320.png"],
  ["Jumbo Cashews W240", "Cashews", 999, 899, "500 g", 22, true, true, "Big, buttery cashews selected for gifting, sweets and premium snacking.", "/products/cashews-w240.png"],
  ["Roasted Salted Cashews", "Cashews", 599, 529, "250 g", 36, true, false, "Lightly roasted cashews with balanced rock salt for a crisp evening snack.", "/products/roasted-salted-cashews.png"],
  ["Foxtail Millet", "Millets", 189, 169, "1 kg", 54, true, true, "A light, versatile ancient grain for pulao, upma and porridge.", "/products/foxtail-millet.png"],
  ["Barnyard Millet", "Millets", 219, 189, "1 kg", 44, true, false, "Quick-cooking millet for khichdi, dosa batter, lemon rice and light dinners.", "/products/barnyard-millet.png"],
  ["Ragi Flour", "Millets", 169, 149, "1 kg", 52, true, true, "Stone-ground finger millet flour for dosa, roti, malt and nourishing porridge.", "/products/ragi-flour.png"],
  ["Clay Handi", "Mitti Cookware", 712, 499, "1 L", 26, true, true, "Unglazed clay handi for slow dal, rice, sabzi and homestyle curries.", "/products/clay-handi.png"],
  ["Clay Biryani Pot", "Mitti Cookware", 1427, 999, "2 L", 16, true, true, "A deep clay pot that lets biryani, pulao and dum dishes cook with gentle heat.", "/products/clay-biryani-pot.png"],
  ["Clay Cooker", "Mitti Cookware", 2855, 1999, "3 L", 10, true, true, "A traditional clay cooker for flavourful everyday meals.", "/products/clay-cooker.png"],
  ["Clay Tawa With Handle", "Mitti Cookware", 999, 499, "9 inch", 20, true, false, "Flat earthen tawa for rotis, bhakri and gentle low-flame cooking.", "/products/clay-tawa.png"],
  ["Clay Curd Pot With Cap", "Mitti Cookware", 1199, 699, "650 ml", 24, false, true, "Terracotta curd pot that helps set thick, naturally flavoured homemade dahi.", "/products/clay-curd-pot.png"],
  ["Clay Water Pot", "Mitti Cookware", 2999, 1999, "11 L", 12, true, true, "A natural terracotta water pot for cool, fresh-tasting drinking water.", "/products/clay-water-pot.png"],
  ["Clay Water Bottle", "Mitti Cookware", 999, 499, "1 L", 30, true, false, "Self-cooling terracotta bottle made for daily hydration and plastic-free tables.", "/products/clay-water-bottle.png"],
  ["Stone-ground Turmeric", "Natural Spices", 179, 149, "200 g", 63, true, true, "Deep golden turmeric, slowly ground for aroma and purity.", "/products/turmeric.png"],
  ["Cold Pressed Groundnut Oil", "Cold Pressed Oils", 429, 389, "1 L", 31, true, false, "Wood-pressed in small batches for a warm, nutty character.", "/products/groundnut-oil.png"]
].map(([name, categoryName, price, discountPrice, weight, stock, featured, bestseller, shortDescription, image], index) => {
  const category = sampleCategory(categoryName);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    id: index + 1000, name, slug, price, discountPrice, weight, stock, featured, bestseller, shortDescription, image,
    categoryId: category.id, category,
    description: `${shortDescription} This frontend sample product is written for a natural pantry and mitti cookware store demo.`,
    benefits: categoryName === "Mitti Cookware" ? "Natural terracotta craft · Gentle heat cooking · Plastic-free kitchen choice" : "Naturally wholesome · Carefully sourced · Hygienically packed",
    usage: categoryName === "Mitti Cookware" ? "Soak before first use, season gently and cook on low to medium heat." : "Store in a cool, dry place. Reseal after opening."
  };
});

const sampleCategories = sampleCategoriesBase.map((category) => ({
  ...category,
  _count: { products: sampleProducts.filter((product) => product.category.slug === category.slug).length }
}));

function sampleProductList(path = "/products") {
  const params = new URLSearchParams(path.split("?")[1] || "");
  const category = params.get("category") || "";
  const search = (params.get("search") || "").toLowerCase();
  const sort = params.get("sort") || "newest";
  let products = sampleProducts.filter((product) =>
    (!category || product.category.slug === category) &&
    (!search || product.name.toLowerCase().includes(search) || product.shortDescription.toLowerCase().includes(search))
  );
  if (sort === "price-low") products = [...products].sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  if (sort === "price-high") products = [...products].sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  if (sort === "bestsellers") products = [...products].sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
  return products;
}

const loadProducts = (path = "/products") => request(path).catch(() => sampleProductList(path));
const loadCategories = () => request("/categories").catch(() => sampleCategories);
const loadProduct = (slug) => request(`/products/${slug}`).catch(() => {
  const product = sampleProducts.find((item) => item.slug === slug);
  if (!product) throw new Error("Product not found");
  return product;
});

const homeSlides = [
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

function Provider({ children }) {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("samruddhi-cart") || "[]"));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("samruddhi-user") || "null"));
  const [notice, setNotice] = useState("");
  useEffect(() => localStorage.setItem("samruddhi-cart", JSON.stringify(cart)), [cart]);
  const add = (product, quantity = 1) => {
    setCart((old) => old.some((x) => x.id === product.id)
      ? old.map((x) => x.id === product.id ? { ...x, quantity: Math.min(x.quantity + quantity, product.stock) } : x)
      : [...old, { ...product, quantity }]);
    setNotice(`${product.name} added to your basket`);
    setTimeout(() => setNotice(""), 2500);
  };
  const update = (id, quantity) => setCart((old) => old.map((x) => x.id === id ? { ...x, quantity: Math.max(1, Math.min(quantity, x.stock)) } : x));
  const remove = (id) => setCart((old) => old.filter((x) => x.id !== id));
  const login = (payload) => {
    localStorage.setItem("samruddhi-token", payload.token);
    localStorage.setItem("samruddhi-user", JSON.stringify(payload.user));
    setUser(payload.user);
  };
  const logout = () => { localStorage.removeItem("samruddhi-token"); localStorage.removeItem("samruddhi-user"); setUser(null); };
  return <AppContext.Provider value={{ cart, add, update, remove, setCart, user, login, logout }}>
    {children}
    {notice && <div className="fixed bottom-7 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white shadow-2xl"><span className="flex items-center gap-2"><BadgeCheck size={18}/>{notice}</span></div>}
  </AppContext.Provider>;
}
const useApp = () => useContext(AppContext);

function Logo({ light = false, compact = false }) {
  return <Link to="/" className="group flex items-center gap-3">
    <span className={`grid place-items-center overflow-hidden ${compact ? "h-10 w-[140px]" : "h-14 w-[170px]"}`}>
      <img src="/samruddhi-logo.svg" alt="Samruddhi" className="h-full w-full object-contain"/>
    </span>
  </Link>;
}

function Navbar() {
  const { cart, user, logout } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const submit = (e) => { e.preventDefault(); navigate(`/products?search=${encodeURIComponent(search)}`); setOpen(false); };
  const links = [["Shop", "/products"], ["Cashews", "/products?category=cashews"], ["Millets", "/products?category=millets"], ["Mitti Cookware", "/products?category=mitti-cookware"], ["Our Story", "/about"]];
  return <>
    <header className="sticky top-0 z-50 border-b border-forest/10 bg-cream/95 backdrop-blur-xl">
      <div className="container-site flex h-[50px] items-center justify-between gap-4">
        <Logo compact/>
        <nav className="hidden items-center gap-6 lg:flex">{links.map(([label, href]) => <NavLink key={label} to={href} className="text-xs font-semibold text-ink/75 transition hover:text-forest">{label}</NavLink>)}</nav>
        <div className="flex items-center gap-2">
          <form onSubmit={submit} className="relative hidden xl:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45" size={15}/><input value={search} onChange={(e)=>setSearch(e.target.value)} className="w-44 rounded-full bg-white py-1.5 pl-9 pr-4 text-xs ring-1 ring-forest/10 focus:w-52" placeholder="Search pantry..."/></form>
          {user ? <button onClick={logout} title="Sign out" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white"><LogOut size={18}/></button> : <Link to="/login" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white"><CircleUserRound size={19}/></Link>}
          <Link to="/cart" className="relative grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-forest/10"><ShoppingBag size={18}/>{cart.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[9px] font-bold text-white">{cart.reduce((s,x)=>s+x.quantity,0)}</span>}</Link>
          <button onClick={()=>setOpen(!open)} className="grid h-9 w-9 place-items-center lg:hidden">{open ? <X size={21}/> : <Menu size={21}/>}</button>
        </div>
      </div>
      <OpeningCountdown/>
      {open && <div className="border-t bg-cream px-5 py-5 lg:hidden"><form onSubmit={submit} className="mb-4"><input value={search} onChange={(e)=>setSearch(e.target.value)} className="field" placeholder="Search products"/></form>{links.map(([label, href]) => <Link onClick={()=>setOpen(false)} key={label} to={href} className="block border-b border-forest/10 py-3 font-semibold">{label}</Link>)}</div>}
    </header>
  </>;
}

function ProductCard({ product }) {
  const { add } = useApp();
  const price = product.discountPrice || product.price;
  return <article className="group overflow-hidden rounded-[1.6rem] border border-forest/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-soft">
    <Link to={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-oat">
      <img src={product.image} alt={`${product.name} by Samruddhi`} className="h-full w-full object-contain p-3 transition duration-700 group-hover:scale-105" onError={(e)=>{e.currentTarget.src="/samruddhi-hero.png"}}/>
      {product.bestseller && <span className="absolute left-3 top-3 rounded-full bg-turmeric px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest">Bestseller</span>}
      <button aria-label="Save product" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-forest opacity-0 transition group-hover:opacity-100"><Heart size={17}/></button>
    </Link>
    <div className="p-5">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-clay">{product.category?.name}</p>
      <Link to={`/products/${product.slug}`}><h3 className="mt-1 text-xl text-forest transition hover:text-clay">{product.name}</h3></Link>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/60">{product.shortDescription}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div><span className="font-display text-xl font-bold text-forest">{money(price)}</span>{product.discountPrice && <span className="ml-2 text-xs text-ink/40 line-through">{money(product.price)}</span>}<p className="text-xs text-ink/45">{product.weight}</p></div>
        <button onClick={()=>add(product)} className="grid h-11 w-11 place-items-center rounded-full bg-forest text-white transition hover:rotate-6 hover:bg-clay"><Plus size={20}/></button>
      </div>
    </div>
  </article>;
}

function SectionHead({ eyebrow, title, body, link }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
    <div><p className="eyebrow">{eyebrow}</p><h2 className="section-title">{title}</h2>{body && <p className="mt-3 max-w-xl text-sm leading-6 text-ink/60">{body}</p>}</div>
    {link && <Link to={link} className="flex items-center gap-2 text-sm font-bold text-forest">View all <ArrowRight size={17}/></Link>}
  </div>;
}

function CollectionSlider({ slide, activeSlide }) {
  return <section className="relative min-h-[calc(100vh-108px)] overflow-hidden bg-forest">
    {homeSlides.map((item, index) => <img key={item.title} src={item.image} alt={`${item.eyebrow} products`} className={`absolute inset-0 h-full w-full object-cover object-center transition duration-700 ${index === slide ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}/>)}
    <div className="absolute inset-0 bg-gradient-to-r from-[#142d20]/90 via-[#142d20]/50 to-black/10"/>
    <div className="absolute inset-0 hero-noise opacity-15"/>
    <div className="container-site relative flex min-h-[calc(100vh-108px)] items-center py-14">
      <div className="max-w-2xl text-white">
        <p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-[#f3c85d]">{activeSlide.eyebrow}</p>
        <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">{activeSlide.title}</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/80 md:text-lg">{activeSlide.body}</p>
        <div className="mt-7 flex flex-wrap gap-2">{activeSlide.highlights.map((item) => <span key={item} className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur ring-1 ring-white/20">{item}</span>)}</div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to={activeSlide.link} className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-forest transition hover:-translate-y-1">{activeSlide.cta}</Link>
          <Link to="/products" className="rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">View all products</Link>
        </div>
      </div>
    </div>
  </section>;
}

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slide, setSlide] = useState(0);
  const activeSlide = homeSlides[slide];
  useEffect(() => { loadProducts("/products").then(setProducts); loadCategories().then(setCategories); }, []);
  useEffect(() => {
    const timer = setInterval(() => setSlide((current) => (current + 1) % homeSlides.length), 4500);
    return () => clearInterval(timer);
  }, []);
  return <main>
    <CollectionSlider slide={slide} activeSlide={activeSlide}/>

    <section className="border-b border-forest/10 bg-white py-7"><div className="container-site grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[
      [Leaf,"Natural clay craft","Hand-finished kitchenware"],[ShieldCheck,"Clean pantry","No needless additives"],[Package,"Freshly packed","Small batches, careful handling"],[Clock3,"Tradition first","Millets, cashews and clay"]
    ].map(([I,t,d])=><div key={t} className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-cream text-leaf"><I size={20}/></span><div><strong className="text-sm text-forest">{t}</strong><p className="text-xs text-ink/50">{d}</p></div></div>)}</div></section>

    <section className="container-site py-20">
      <SectionHead eyebrow="Shop by range" title="Goodness, thoughtfully gathered" body="Inspired by traditional Indian kitchens: clay handis and water pots, premium cashews, ancient millets, spices, oils and daily staples." link="/products"/>
      <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-3">{categories.map((c, i)=><div key={c.id} className="min-w-[180px] flex-1 rounded-[1.5rem] border border-forest/10 bg-white p-5"><span className={`grid h-12 w-12 place-items-center rounded-full ${i%2 ? "bg-oat text-clay" : "bg-leaf/10 text-leaf"} font-display text-lg font-bold`}>{c.name === "Mitti Cookware" ? "MC" : categoryIcons[c.name] || c.name[0]}</span><h3 className="mt-6 text-lg text-forest">{c.name}</h3></div>)}</div>
    </section>

    <section className="bg-white py-20"><div className="container-site">
      <SectionHead eyebrow="Mitti cookware" title="Sample clay collection" body="Product ideas based on common clay cookware and waterware categories: handis, tawa, biryani pots, curd pots, water bottles and cooling water pots." link="/products?category=mitti-cookware"/>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Clay Handi & Biryani Pot","Slow-cook dal, rice and dum dishes in earthy unglazed clay.","/collections/clay-handi-biryani-pot.png"],
        ["Clay Water Pot","Naturally cool drinking water with a clean terracotta taste.","/collections/clay-water-pot-collection.png"],
        ["Curd Pot & Tableware","Set thick homemade dahi and serve chai, lassi and snacks beautifully.","/collections/clay-curd-tableware.png"],
        ["Clay Tawa & Cooker","Everyday roti, bhakri and homestyle meals with gentle heat.","/collections/clay-tawa-cooker.png"]
      ].map(([title, body, image])=><Link key={title} to="/products?category=mitti-cookware" className="group overflow-hidden rounded-[1.5rem] border border-forest/10 bg-cream transition hover:-translate-y-1 hover:shadow-soft"><img src={image} alt={title} className="h-48 w-full object-cover transition duration-700 group-hover:scale-105"/><div className="p-5"><h3 className="text-xl text-forest">{title}</h3><p className="mt-2 text-sm leading-6 text-ink/55">{body}</p></div></Link>)}</div>
    </div></section>

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

    <section className="bg-oat py-20"><div className="container-site"><SectionHead eyebrow="Kind words" title="From kitchens like yours"/><div className="grid gap-5 md:grid-cols-3">{[
      ["The cashews were genuinely fresh and creamy. Even the packaging felt thoughtful.","Ananya Rao","Bengaluru"],
      ["My clay handi has changed Sunday dal entirely—slow, earthy and worth the little ritual.","Meera Kulkarni","Pune"],
      ["Millets that are clean, easy to cook and actually taste lovely. I keep coming back.","Rohan Shah","Mumbai"]
    ].map(([q,n,c])=><blockquote key={n} className="rounded-[1.75rem] bg-white p-7"><div className="flex text-turmeric">{[1,2,3,4,5].map(i=><Star key={i} size={15} fill="currentColor"/>)}</div><p className="mt-5 font-display text-xl leading-8 text-forest">“{q}”</p><footer className="mt-6 text-xs"><strong>{n}</strong><span className="text-ink/45"> · {c}</span></footer></blockquote>)}</div></div></section>

    <Newsletter/>
  </main>;
}

function Newsletter() {
  const [done,setDone]=useState(false);
  return <section className="container-site py-20"><div className="relative overflow-hidden rounded-[2rem] bg-clay px-7 py-14 text-center text-white md:px-14"><Leaf className="absolute -left-10 -top-10 h-40 w-40 rotate-12 text-white/5"/><p className="text-xs font-bold uppercase tracking-[.22em] text-oat">A little goodness in your inbox</p><h2 className="mt-3 text-3xl md:text-4xl">Recipes, rituals & fresh arrivals.</h2><p className="mx-auto mt-3 max-w-lg text-sm text-white/70">Join our table for practical millet recipes, clay-pot care and member-only offers.</p>{done?<p className="mt-7 font-bold">You’re on the list. Welcome to the table!</p>:<form onSubmit={(e)=>{e.preventDefault();setDone(true)}} className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row"><input required type="email" className="min-w-0 flex-1 rounded-full bg-white px-5 py-3 text-sm text-ink" placeholder="Your email address"/><button className="rounded-full bg-forest px-6 py-3 text-sm font-bold">Subscribe</button></form>}</div></section>;
}

function Products() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [products,setProducts]=useState([]), [categories,setCategories]=useState([]), [loading,setLoading]=useState(true);
  const category=params.get("category")||"", query=params.get("search")||"", initialSort=params.get("sort")||"newest";
  const [sort,setSort]=useState(initialSort), [maxPrice,setMaxPrice]=useState(2500);
  useEffect(()=>{setLoading(true); loadProducts(`/products?category=${category}&search=${encodeURIComponent(query)}&sort=${sort}`).then(setProducts).finally(()=>setLoading(false));},[location.search,sort]);
  useEffect(()=>{loadCategories().then(setCategories)},[]);
  const shown=products.filter(p=>(p.discountPrice||p.price)<=maxPrice);
  return <main className="container-site py-12">
    <div className="rounded-[2rem] bg-forest px-7 py-10 text-white md:px-12"><p className="text-xs font-bold uppercase tracking-[.2em] text-oat">The Samruddhi pantry</p><h1 className="mt-2 text-4xl md:text-5xl">{query ? `Results for “${query}”` : category ? categories.find(c=>c.slug===category)?.name || "Shop" : "Pure choices for everyday living"}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Naturally sourced foods and traditional kitchenware, packed carefully and delivered to your door.</p></div>
    <div className="mt-9 grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-8">
        <div><h3 className="font-sans text-sm font-bold uppercase tracking-wider">Categories</h3><div className="mt-4 space-y-2"><Link to="/products" className={`block text-sm ${!category?"font-bold text-clay":"text-ink/60"}`}>All products</Link>{categories.map(c=><Link key={c.id} to={`/products?category=${c.slug}`} className={`block text-sm ${category===c.slug?"font-bold text-clay":"text-ink/60 hover:text-forest"}`}>{c.name} <span className="text-ink/35">({c._count?.products})</span></Link>)}</div></div>
        <div><h3 className="font-sans text-sm font-bold uppercase tracking-wider">Price up to</h3><input type="range" min="100" max="2500" step="100" value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))} className="mt-4 w-full accent-forest"/><p className="mt-2 text-sm font-semibold">{money(maxPrice)}</p></div>
        <div className="rounded-2xl bg-oat p-5"><Leaf className="text-leaf"/><p className="mt-3 font-display text-lg text-forest">Need help choosing?</p><p className="mt-2 text-xs leading-5 text-ink/55">Chat with us for product guidance and bulk enquiries.</p><a href="https://wa.me/919876543210" className="mt-4 inline-block text-xs font-bold text-clay">WhatsApp us →</a></div>
      </aside>
      <div><div className="mb-5 flex items-center justify-between"><p className="text-sm text-ink/50">{shown.length} products</p><label className="relative"><select value={sort} onChange={e=>setSort(e.target.value)} className="appearance-none rounded-full border border-forest/15 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold"><option value="newest">Newest first</option><option value="bestsellers">Best sellers</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"/></label></div>
        {loading?<div className="py-24 text-center text-ink/40">Gathering the pantry...</div>:<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map(p=><ProductCard key={p.id} product={p}/>)}</div>}</div>
    </div>
  </main>;
}

function ProductDetails() {
  const { slug }=useParams(), {add}=useApp(), navigate=useNavigate();
  const [product,setProduct]=useState(null), [qty,setQty]=useState(1);
  useEffect(()=>{loadProduct(slug).then(setProduct).catch(()=>navigate("/products"))},[slug]);
  if(!product) return <div className="container-site py-28 text-center">Loading product…</div>;
  const price=product.discountPrice||product.price;
  return <main className="container-site py-12"><div className="mb-7 text-xs text-ink/45"><Link to="/">Home</Link> / <Link to="/products">Products</Link> / {product.name}</div>
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="overflow-hidden rounded-[2rem] bg-oat"><img src={product.image} alt={product.name} className="aspect-square w-full object-contain p-5" onError={e=>e.currentTarget.src="/samruddhi-hero.png"}/></div>
      <div className="lg:py-5"><p className="eyebrow">{product.category.name}</p><h1 className="mt-2 text-4xl text-forest md:text-5xl">{product.name}</h1><div className="mt-4 flex items-center gap-2 text-xs"><span className="flex text-turmeric">{[1,2,3,4,5].map(i=><Star key={i} size={15} fill="currentColor"/>)}</span><span className="text-ink/45">4.9 · 86 reviews</span></div><p className="mt-6 text-3xl font-bold text-forest">{money(price)} {product.discountPrice&&<span className="ml-2 text-base font-normal text-ink/35 line-through">{money(product.price)}</span>}</p><p className="mt-1 text-xs text-ink/45">Inclusive of all taxes · {product.weight}</p><p className="mt-7 leading-7 text-ink/65">{product.description}</p>
        <div className="mt-7 flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${product.stock?"bg-leaf":"bg-red-500"}`}/><span className="text-sm font-semibold">{product.stock ? `In stock · ${product.stock} available` : "Out of stock"}</span></div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><div className="flex h-12 items-center justify-between rounded-full border border-forest/15 bg-white px-3 sm:w-32"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={17}/></button><span className="font-bold">{qty}</span><button onClick={()=>setQty(Math.min(product.stock,qty+1))}><Plus size={17}/></button></div><button onClick={()=>add(product,qty)} className="btn-primary flex-1"><ShoppingCart size={18}/> Add to basket</button><button onClick={()=>{add(product,qty);navigate("/checkout")}} className="btn-light flex-1">Buy now</button></div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2">{[[Leaf,"Naturally sourced"],[ShieldCheck,"Quality assured"],[Truck,"Careful delivery"],[Package,"Freshly packed"]].map(([I,t])=><div key={t} className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm font-semibold"><I size={19} className="text-clay"/>{t}</div>)}</div>
      </div>
    </div>
    <div className="mt-16 grid gap-5 md:grid-cols-3">{[["Why you’ll love it",product.benefits],["How to use",product.usage],["Our packing promise","Packed in clean, food-safe materials and handled in small batches to preserve natural character."]].map(([t,d])=><div key={t} className="card p-7"><h3 className="text-xl text-forest">{t}</h3><p className="mt-3 text-sm leading-6 text-ink/60">{d}</p></div>)}</div>
  </main>;
}

function Cart() {
  const {cart,update,remove}=useApp(), navigate=useNavigate();
  const subtotal=cart.reduce((s,x)=>s+(x.discountPrice||x.price)*x.quantity,0), delivery=subtotal>=999?0:79;
  if(!cart.length) return <main className="container-site py-24 text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-oat text-clay"><ShoppingBag size={32}/></span><h1 className="mt-6 text-4xl text-forest">Your basket is waiting.</h1><p className="mt-3 text-ink/55">Add something wholesome from our pantry.</p><Link to="/products" className="btn-primary mt-7">Explore products</Link></main>;
  return <main className="container-site py-12"><h1 className="text-4xl text-forest">Your basket</h1><p className="mt-2 text-sm text-ink/50">{cart.reduce((s,x)=>s+x.quantity,0)} items, packed with care</p><div className="mt-9 grid gap-8 lg:grid-cols-[1fr_380px]"><div className="space-y-4">{cart.map(item=><div key={item.id} className="card flex gap-4 p-4 sm:gap-6"><img src={item.image} className="h-28 w-28 rounded-2xl bg-oat object-contain p-2" alt={item.name}/><div className="flex flex-1 flex-col justify-between py-1"><div className="flex justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-clay">{item.category?.name}</p><h3 className="mt-1 text-xl text-forest">{item.name}</h3><p className="text-xs text-ink/45">{item.weight}</p></div><button onClick={()=>remove(item.id)} className="text-ink/35 hover:text-red-600"><Trash2 size={18}/></button></div><div className="flex items-end justify-between"><div className="flex items-center gap-3 rounded-full border px-3 py-1.5"><button onClick={()=>update(item.id,item.quantity-1)}><Minus size={14}/></button><span className="text-sm font-bold">{item.quantity}</span><button onClick={()=>update(item.id,item.quantity+1)}><Plus size={14}/></button></div><strong>{money((item.discountPrice||item.price)*item.quantity)}</strong></div></div></div>)}</div>
      <aside className="card h-fit p-7"><h2 className="text-2xl text-forest">Order summary</h2><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between text-ink/60"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between text-ink/60"><span>Delivery</span><span>{delivery?money(delivery):"Free"}</span></div>{delivery>0&&<p className="rounded-xl bg-oat p-3 text-xs text-forest">Add {money(999-subtotal)} more for free delivery.</p>}<div className="flex justify-between border-t border-forest/10 pt-4 text-lg font-bold"><span>Total</span><span>{money(subtotal+delivery)}</span></div></div><p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-ink/45"><ShieldCheck size={14}/> Secure and carefully handled</p></aside></div></main>;
}

function Checkout() {
  const {cart,setCart,user}=useApp(), navigate=useNavigate();
  const [form,setForm]=useState({customerName:user?.name||"",mobile:"",email:user?.email||"",address:"",city:"",pincode:""}), [paymentMethod,setPayment]=useState("COD"), [busy,setBusy]=useState(false), [error,setError]=useState("");
  const subtotal=cart.reduce((s,x)=>s+(x.discountPrice||x.price)*x.quantity,0), delivery=subtotal>=999?0:79;
  const submit=async(e)=>{e.preventDefault();setBusy(true);setError("");try{const order=await request("/orders",{method:"POST",body:JSON.stringify({customer:form,paymentMethod,items:cart.map(x=>({productId:x.id,quantity:x.quantity}))})});setCart([]);navigate(`/order-success/${order.orderNumber}`)}catch(e){setError(e.message)}finally{setBusy(false)}};
  if(!cart.length) return <div className="container-site py-24 text-center"><h1 className="text-4xl text-forest">Your basket is empty.</h1><Link to="/products" className="btn-primary mt-6">Shop now</Link></div>;
  return <main className="container-site py-12"><div className="grid gap-10 lg:grid-cols-[1fr_390px]"><form onSubmit={submit}><p className="eyebrow">Almost home</p><h1 className="mt-2 text-4xl text-forest">Delivery details</h1><div className="mt-8 grid gap-4 sm:grid-cols-2">{[["customerName","Full name"],["mobile","Mobile number"],["email","Email address"],["city","City"],["pincode","Pincode"]].map(([n,p])=><input key={n} required name={n} value={form[n]} onChange={e=>setForm({...form,[n]:e.target.value})} className="field" placeholder={p}/>) }<textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="field min-h-28 sm:col-span-2" placeholder="Complete delivery address"/></div><h2 className="mt-9 text-2xl text-forest">Payment method</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{[["COD","Cash on delivery"],["ONLINE","Online payment (placeholder)"]].map(([v,l])=><label key={v} className={`cursor-pointer rounded-2xl border p-4 text-sm font-semibold ${paymentMethod===v?"border-forest bg-forest/5":"border-forest/10 bg-white"}`}><input type="radio" value={v} checked={paymentMethod===v} onChange={()=>setPayment(v)} className="mr-3 accent-forest"/>{l}</label>)}</div>{error&&<p className="mt-4 text-sm text-red-600">{error}</p>}<button disabled={busy} className="btn-primary mt-8 w-full sm:w-auto">{busy?"Placing order…":"Place order"} <ArrowRight size={17}/></button></form>
    <aside className="card h-fit p-6"><h2 className="text-2xl text-forest">Your order</h2><div className="mt-5 max-h-72 space-y-4 overflow-auto">{cart.map(x=><div key={x.id} className="flex gap-3"><img src={x.image} className="h-14 w-14 rounded-xl bg-oat object-contain p-1"/><div className="flex-1"><p className="text-sm font-semibold">{x.name}</p><p className="text-xs text-ink/45">{x.weight} · Qty {x.quantity}</p></div><span className="text-sm font-bold">{money((x.discountPrice||x.price)*x.quantity)}</span></div>)}</div><div className="mt-5 space-y-2 border-t pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{delivery?money(delivery):"Free"}</span></div><div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span>{money(subtotal+delivery)}</span></div></div></aside></div></main>;
}

function AuthPage({register=false}) {
  const {login}=useApp(), navigate=useNavigate(); const [form,setForm]=useState({name:"",email:"",mobile:"",password:""}),[error,setError]=useState("");
  const submit=async(e)=>{e.preventDefault();try{const data=await request(`/auth/${register?"register":"login"}`,{method:"POST",body:JSON.stringify(form)});login(data);navigate(data.user.role==="ADMIN"?"/admin":"/products")}catch(e){setError(e.message)}};
  return <main className="container-site py-16"><div className="mx-auto grid max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-soft md:grid-cols-2"><div className="relative hidden min-h-[570px] md:block"><img src="/samruddhi-hero.png" className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-forest/65"/><div className="relative flex h-full flex-col justify-end p-9 text-white"><Leaf size={30}/><h2 className="mt-4 text-4xl">A more natural pantry starts here.</h2><p className="mt-3 text-sm text-white/70">Save favourites, track orders and make wholesome shopping simpler.</p></div></div><form onSubmit={submit} className="p-8 md:p-10"><p className="eyebrow">{register?"Join the table":"Welcome back"}</p><h1 className="mt-2 text-3xl text-forest">{register?"Create your account":"Sign in to Samruddhi"}</h1><div className="mt-7 space-y-4">{register&&<><input required className="field" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input className="field" placeholder="Mobile number" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})}/></>}<input required type="email" className="field" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input required minLength={6} type="password" className="field" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>{error&&<p className="mt-4 text-sm text-red-600">{error}</p>}<button className="btn-primary mt-6 w-full">{register?"Create account":"Sign in"}</button><p className="mt-5 text-center text-sm text-ink/50">{register?"Already have an account?":"New to Samruddhi?"} <Link className="font-bold text-clay" to={register?"/login":"/register"}>{register?"Sign in":"Create account"}</Link></p></form></div></main>;
}

function Orders() {
  const {user}=useApp(); const [orders,setOrders]=useState([]);
  useEffect(()=>{if(user)request("/orders/mine").then(setOrders)},[user]);
  if(!user)return <AuthPage/>;
  return <main className="container-site py-12"><h1 className="text-4xl text-forest">Your orders</h1><div className="mt-8 space-y-5">{orders.length?orders.map(o=><div key={o.id} className="card p-6"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-ink/45">Order {o.orderNumber}</p><h3 className="mt-1 text-xl text-forest">{o.items.length} items · {money(o.total)}</h3></div><span className="h-fit rounded-full bg-leaf/10 px-4 py-2 text-xs font-bold text-forest">{o.status}</span></div><div className="mt-5 flex flex-wrap gap-3">{o.items.map(i=><span key={i.id} className="rounded-full bg-cream px-3 py-2 text-xs">{i.name} × {i.quantity}</span>)}</div></div>):<p className="text-ink/50">No orders yet.</p>}</div></main>;
}

function Admin() {
  const {user}=useApp(); const [tab,setTab]=useState("overview"),[products,setProducts]=useState([]),[orders,setOrders]=useState([]),[categories,setCategories]=useState([]),[editing,setEditing]=useState(null);
  const load=()=>{request("/products").then(setProducts);request("/orders").then(setOrders);request("/categories").then(setCategories)};
  useEffect(()=>{if(user?.role==="ADMIN")load()},[user]);
  if(user?.role!=="ADMIN")return <main className="container-site py-24 text-center"><h1 className="text-4xl text-forest">Admin access only</h1><Link to="/login" className="btn-primary mt-6">Admin login</Link></main>;
  const saveProduct=async(e)=>{e.preventDefault();const form=Object.fromEntries(new FormData(e.currentTarget));const data={...form,featured:form.featured==="on",bestseller:form.bestseller==="on",description:form.description||form.shortDescription,benefits:form.benefits||"Naturally sourced • Carefully packed",usage:form.usage||"Store in a cool, dry place."}; await request(editing?`/products/${editing.id}`:"/products",{method:editing?"PUT":"POST",body:JSON.stringify(data)});setEditing(null);load()};
  const del=async id=>{if(confirm("Delete this product?")){await request(`/products/${id}`,{method:"DELETE"});load()}};
  const updateStatus=async(id,status)=>{await request(`/orders/${id}/status`,{method:"PATCH",body:JSON.stringify({status})});load()};
  return <main className="min-h-[700px] bg-[#eee8da] py-8"><div className="container-site grid gap-6 lg:grid-cols-[230px_1fr]"><aside className="card h-fit p-4"><div className="p-3"><Logo/></div><div className="mt-5 space-y-1">{[["overview",LayoutDashboard,"Overview"],["products",Package,"Products"],["orders",ShoppingBag,"Orders"]].map(([v,I,l])=><button key={v} onClick={()=>setTab(v)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${tab===v?"bg-forest text-white":"hover:bg-cream"}`}><I size={18}/>{l}</button>)}</div></aside>
    <section>{tab==="overview"&&<><h1 className="text-4xl text-forest">Good morning, {user.name.split(" ")[0]}.</h1><p className="mt-2 text-sm text-ink/50">Here’s what’s happening at Samruddhi.</p><div className="mt-8 grid gap-5 sm:grid-cols-3">{[["Products",products.length,Package],["Orders",orders.length,ShoppingBag],["Revenue",money(orders.reduce((s,o)=>s+Number(o.total),0)),Sparkles]].map(([l,v,I])=><div key={l} className="card p-6"><I className="text-clay"/><p className="mt-5 text-sm text-ink/50">{l}</p><strong className="font-display text-3xl text-forest">{v}</strong></div>)}</div></>}
      {tab==="products"&&<><div className="flex items-center justify-between"><div><h1 className="text-4xl text-forest">Products</h1><p className="mt-1 text-sm text-ink/50">Manage catalogue, pricing and stock.</p></div><button onClick={()=>setEditing({})} className="btn-primary"><Plus size={17}/> Add product</button></div>{editing&&<form onSubmit={saveProduct} className="card mt-6 grid gap-4 p-6 sm:grid-cols-2"><h2 className="text-2xl text-forest sm:col-span-2">{editing.id?"Edit product":"New product"}</h2>{[["name","Product name"],["weight","Weight / size"],["price","Price"],["discountPrice","Discount price"],["stock","Stock"],["image","Image URL"],["shortDescription","Short description"],["description","Long description"],["benefits","Benefits"],["usage","Usage instructions"]].map(([n,p])=><input key={n} required={["name","weight","price","stock","image","shortDescription"].includes(n)} name={n} defaultValue={editing[n]||""} placeholder={p} className={`field ${["shortDescription","description","benefits","usage"].includes(n)?"sm:col-span-2":""}`}/>)}<select name="categoryId" defaultValue={editing.categoryId||""} className="field" required><option value="">Choose category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><div className="flex items-center gap-5 text-sm"><label><input name="featured" type="checkbox" defaultChecked={editing.featured} className="mr-2"/>Featured</label><label><input name="bestseller" type="checkbox" defaultChecked={editing.bestseller} className="mr-2"/>Bestseller</label></div><div className="flex gap-3 sm:col-span-2"><button className="btn-primary"><Save size={17}/> Save product</button><button type="button" onClick={()=>setEditing(null)} className="btn-light">Cancel</button></div></form>}<div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-forest text-white"><tr>{["Product","Category","Price","Stock","Actions"].map(h=><th key={h} className="px-5 py-4">{h}</th>)}</tr></thead><tbody>{products.map(p=><tr key={p.id} className="border-b border-forest/10"><td className="px-5 py-4"><div className="flex items-center gap-3"><img src={p.image} className="h-11 w-11 rounded-xl object-cover"/><strong>{p.name}</strong></div></td><td className="px-5 py-4">{p.category.name}</td><td className="px-5 py-4">{money(p.discountPrice||p.price)}</td><td className="px-5 py-4">{p.stock}</td><td className="px-5 py-4"><button onClick={()=>setEditing(p)} className="mr-3 text-forest"><Pencil size={17}/></button><button onClick={()=>del(p.id)} className="text-red-600"><Trash2 size={17}/></button></td></tr>)}</tbody></table></div></>}
      {tab==="orders"&&<><h1 className="text-4xl text-forest">Orders</h1><p className="mt-1 text-sm text-ink/50">Review customers and move orders through fulfilment.</p><div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-forest text-white"><tr>{["Order","Customer","Items","Total","Status","Date"].map(h=><th key={h} className="px-5 py-4">{h}</th>)}</tr></thead><tbody>{orders.map(o=><tr key={o.id} className="border-b border-forest/10"><td className="px-5 py-4 font-bold">{o.orderNumber}</td><td className="px-5 py-4">{o.customerName}<br/><span className="text-xs text-ink/45">{o.mobile}</span></td><td className="px-5 py-4">{o.items.reduce((s,i)=>s+i.quantity,0)}</td><td className="px-5 py-4 font-bold">{money(o.total)}</td><td className="px-5 py-4"><select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} className="rounded-lg border bg-white px-2 py-2">{["PENDING","CONFIRMED","PACKED","SHIPPED","DELIVERED","CANCELLED"].map(s=><option key={s}>{s}</option>)}</select></td><td className="px-5 py-4">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td></tr>)}</tbody></table></div></>}</section></div></main>;
}

function About() { return <main><section className="bg-forest py-20 text-white"><div className="container-site max-w-4xl text-center"><p className="text-xs font-bold uppercase tracking-[.22em] text-oat">Our story</p><h1 className="mt-4 text-5xl md:text-6xl">A fuller pantry. A simpler promise.</h1><p className="mx-auto mt-6 max-w-2xl leading-7 text-white/70">Samruddhi means prosperity—not merely more, but better: nourishment that respects farms, makers, kitchens and the rhythms that connect them.</p></div></section><section className="container-site grid gap-12 py-20 lg:grid-cols-2"><img src="/samruddhi-hero.png" className="h-[500px] w-full rounded-[2rem] object-cover" alt="Samruddhi farm to kitchen collection"/><div className="self-center"><p className="eyebrow">From farm to kitchen</p><h2 className="section-title">Tradition, without the dust.</h2><p className="mt-6 leading-8 text-ink/60">We built Samruddhi for people who want the wisdom of an Indian pantry with the clarity and care of a modern one. Our shelves favour traceable staples, gently processed ingredients, nourishing ancient grains and clay cookware that rewards slow cooking.</p><p className="mt-4 leading-8 text-ink/60">Every product earns its place through taste, usefulness and integrity. No theatre—just good food, honest materials and thoughtful service.</p></div></section></main> }
function Contact(){return <main className="container-site py-16"><div className="grid gap-10 lg:grid-cols-2"><div><p className="eyebrow">We’re here</p><h1 className="section-title">Let’s talk pantry.</h1><p className="mt-4 max-w-md text-ink/60">Questions about an ingredient, clay-pot care or a bulk order? Our small team would love to help.</p><div className="mt-8 space-y-4 text-sm">{[[Phone,"+91 98765 43210"],[Mail,"purchase@samruddhi.store"],[MapPin,"vizag,AndhraPradesh,India"]].map(([I,t])=><p key={t} className="flex items-center gap-3"><I className="text-clay"/>{t}</p>)}</div></div><form className="card space-y-4 p-7" onSubmit={e=>e.preventDefault()}><input className="field" placeholder="Your name"/><input className="field" placeholder="Email address"/><textarea className="field min-h-32" placeholder="How can we help?"/><button className="btn-primary">Send message</button></form></div></main>}
function Success(){const {number}=useParams();return <main className="container-site py-24 text-center"><span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-leaf/10 text-leaf"><BadgeCheck size={45}/></span><h1 className="mt-7 text-4xl text-forest">Your order is in good hands.</h1><p className="mt-3 text-ink/55">Order <strong>{number}</strong> is confirmed. We’ll keep you updated as it travels from our pantry to yours.</p><Link to="/products" className="btn-primary mt-7">Continue shopping</Link></main>}

function Footer() { return <footer className="bg-[#1e382a] pt-14 text-white"><div className="container-site grid gap-10 pb-12 md:grid-cols-2 lg:grid-cols-4"><div><Logo light/><p className="mt-5 text-sm leading-6 text-white/55">Natural pantry essentials and traditional kitchenware, brought from trusted hands to your home.</p><div className="mt-5 flex gap-3"><Instagram size={19}/><Facebook size={19}/></div></div><div><h3 className="font-sans text-sm font-bold">Shop</h3><div className="mt-4 space-y-2 text-sm text-white/55"><Link className="block" to="/products?category=cashews">Cashews & dry fruits</Link><Link className="block" to="/products?category=millets">Millets</Link><Link className="block" to="/products?category=natural-spices">Spices & staples</Link><Link className="block" to="/products?category=mitti-cookware">Mitti cookware</Link></div></div><div><h3 className="font-sans text-sm font-bold">Help</h3><div className="mt-4 space-y-2 text-sm text-white/55"><Link className="block" to="/about">Our story</Link><Link className="block" to="/contact">Contact</Link><Link className="block" to="/orders">Track orders</Link><span className="block">Shipping & returns</span></div></div><div><h3 className="font-sans text-sm font-bold">Contact</h3><div className="mt-4 space-y-3 text-sm text-white/55"><p>+91 98765 43210</p><p>hello@samruddhi.in</p><p>Pune, Maharashtra</p></div></div></div><div className="border-t border-white/10 py-5"><div className="container-site flex flex-col justify-between gap-2 text-xs text-white/35 sm:flex-row"><span>© 2026 Samruddhi. All rights reserved.</span><span>Rooted in India · Packed with care</span></div></div></footer> }

function App() {
  return <Provider><ScrollTop/><Navbar/><GrandOpeningPopup/><Routes>
    <Route path="/" element={<Home/>}/><Route path="/products" element={<Products/>}/><Route path="/products/:slug" element={<ProductDetails/>}/>
    <Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage register/>}/>
    <Route path="/orders" element={<Orders/>}/><Route path="/admin" element={<Admin/>}/><Route path="/about" element={<About/>}/><Route path="/contact" element={<Contact/>}/><Route path="/order-success/:number" element={<Success/>}/>
  </Routes><Footer/><a href="https://wa.me/919885311170" aria-label="WhatsApp Samruddhi" className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-xl font-bold text-white shadow-xl">W</a></Provider>;
}
function ScrollTop(){const {pathname}=useLocation();useEffect(()=>window.scrollTo(0,0),[pathname]);return null}
export default App;
