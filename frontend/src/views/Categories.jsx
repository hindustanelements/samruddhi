"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { categoryImage, loadCategories } from "../lib/store";

export default function Categories() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const query = useMemo(() => new URLSearchParams(location.search).get("search") || "", [location.search]);
  useEffect(() => { loadCategories().then(setCategories); }, []);
  const filteredCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? categories.filter((category) => category.name.toLowerCase().includes(term)) : categories;
  }, [categories, query]);
  return <main>
    <section className="bg-forest py-16 text-white">
      <div className="container-site">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-oat">Shop by category</p>
        <h1 className="mt-3 text-5xl">Choose your pantry path.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-white/70">Browse Samruddhi by range: clean staples, premium dry fruits, ancient millets, cold pressed oils, natural spices and mitti cookware.</p>
      </div>
    </section>
    <section className="container-site py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[.22em] text-forest">Browse categories</h2>
          {query && <p className="mt-2 text-sm text-ink/60">Showing {filteredCategories.length} categories for “{query}”.</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {filteredCategories.map((category)=><Link key={category.id} to={`/products?category=${category.slug}`} className="group overflow-hidden rounded-[1.5rem] border border-forest/10 bg-white transition hover:-translate-y-1 hover:shadow-soft">
          <img src={categoryImage(category)} alt={category.name} className="aspect-[4/3] w-full bg-oat object-cover transition duration-500 group-hover:scale-105" onError={(e)=>{e.currentTarget.src="/samruddhi-hero.png"}}/>
          <div className="p-4">
            <h2 className="text-lg leading-tight text-forest">{category.name}</h2>
            <span className="mt-4 inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold text-clay">View products <ArrowRight size={14} className="shrink-0"/></span>
          </div>
        </Link>)}
      </div>
    </section>
  </main>;
}
