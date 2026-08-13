"use client";

import { Link } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { money } from "../lib/store";

export default function ProductCard({ product }) {
  const { add } = useApp();
  const price = product.discountPrice || product.price;
  return <article className="group overflow-hidden rounded-[1.6rem] border border-forest/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-soft">
    <Link to={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-white">
      <img src={product.image} alt={`${product.name} by Samruddhi`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" onError={(e)=>{e.currentTarget.src="/samruddhi-hero.png"}}/>
      {product.bestseller && <span className="absolute left-3 top-3 rounded-full bg-turmeric px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-forest">Bestseller</span>}
      <button aria-label="Save product" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-forest opacity-0 transition group-hover:opacity-100"><Heart size={17}/></button>
    </Link>
    <div className="p-5">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-clay">{product.category?.name}</p>
      <Link to={`/products/${product.slug}`}><h3 className="mt-1 text-xl text-forest transition hover:text-clay">{product.name}</h3></Link>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/60">{product.shortDescription}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0"><span className="whitespace-nowrap font-display text-xl font-bold text-forest">{money(price)}</span>{product.discountPrice && <span className="ml-2 whitespace-nowrap text-xs text-ink/40 line-through">{money(product.price)}</span>}<p className="truncate text-xs text-ink/45">{product.weight}</p></div>
        <button onClick={()=>add(product)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-white transition hover:rotate-6 hover:bg-clay"><Plus size={20}/></button>
      </div>
    </div>
  </article>;
}
