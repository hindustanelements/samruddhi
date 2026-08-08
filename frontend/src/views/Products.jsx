"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Leaf } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { loadCategories, loadProducts, money, STORE_WHATSAPP } from "../lib/store";

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
        <div className="rounded-2xl bg-oat p-5"><Leaf className="text-leaf"/><p className="mt-3 font-display text-lg text-forest">Need help choosing?</p><p className="mt-2 text-xs leading-5 text-ink/55">Chat with us for product guidance and bulk enquiries.</p><a href={`https://wa.me/${STORE_WHATSAPP}`} className="mt-4 inline-block text-xs font-bold text-clay">WhatsApp us →</a></div>
      </aside>
      <div><div className="mb-5 flex items-center justify-between"><p className="text-sm text-ink/50">{shown.length} products</p><label className="relative"><select value={sort} onChange={e=>setSort(e.target.value)} className="appearance-none rounded-full border border-forest/15 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold"><option value="newest">Newest first</option><option value="bestsellers">Best sellers</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"/></label></div>
        {loading?<div className="py-24 text-center text-ink/40">Gathering the pantry...</div>:<div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{shown.map(p=><ProductCard key={p.id} product={p}/>)}</div>}</div>
    </div>
  </main>;
}

export default Products;
