"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Leaf, Minus, Package, Plus, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { loadProduct, money } from "../lib/store";

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

export default ProductDetails;
