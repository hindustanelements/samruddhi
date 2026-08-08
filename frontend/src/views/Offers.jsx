"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgePercent } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { loadProducts, money } from "../lib/store";

function Offers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts("/products?sort=bestsellers")
      .then((items) => setProducts(items.filter((p) => p.discountPrice && p.discountPrice < p.price)))
      .finally(() => setLoading(false));
  }, []);

  const bestSaving = products.reduce((max, p) => Math.max(max, p.price - p.discountPrice), 0);
  const categoryDeals = [
    ["Dry Fruits", "/products?category=dry-fruits"],
    ["Millets", "/products?category=millets"],
    ["Mitti Products", "/products?category=mitti-cookware"],
    ["Cold Pressed Oils", "/products?category=cold-pressed-oils"]
  ];

  return <main className="container-site py-12">
    <section className="rounded-[2rem] bg-forest px-7 py-10 text-white md:px-12">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-oat">Samruddhi offers</p>
      <h1 className="mt-2 text-4xl md:text-5xl">Fresh deals for your pantry</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{bestSaving ? `Save up to ${money(bestSaving)} on selected products.` : "Browse current deals and customer favourites."}</p>
    </section>
    <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categoryDeals.map(([label, href]) => <Link key={label} to={href} className="flex items-center justify-between rounded-2xl border border-forest/10 bg-white p-5 text-sm font-bold text-forest shadow-soft transition hover:-translate-y-0.5 hover:text-leaf"><span className="flex items-center gap-3"><BadgePercent size={18} className="text-clay"/>{label}</span><ArrowRight size={16}/></Link>)}</section>
    <section className="mt-10">
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">Discounted products</p><h2 className="section-title">Today&apos;s savings</h2></div><Link to="/products?sort=price-low" className="hidden items-center gap-2 text-sm font-bold text-forest sm:flex">All products <ArrowRight size={17}/></Link></div>
      {loading ? <div className="py-20 text-center text-ink/40">Finding the best offers...</div> : products.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="rounded-2xl bg-oat p-8 text-center text-ink/55"><p>No active product discounts right now.</p><Link to="/products" className="btn-primary mt-5">Browse products</Link></div>}
    </section>
  </main>;
}

export default Offers;
