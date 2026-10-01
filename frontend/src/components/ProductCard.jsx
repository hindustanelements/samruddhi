"use client";

import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useApp } from "../context/AppContext";
import { money } from "../lib/store";

export default function ProductCard({ product }) {
  const { add } = useApp();
  const price = product.discountPrice || product.price;
  const isOutOfStock = Number(product.stock) <= 0;

  return <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-forest/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-soft">
    <Link to={`/products/${product.slug}`} className="block">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-white">
        <img src={product.image} alt={product.name} className={`block h-full w-full object-contain transition duration-500 group-hover:scale-105 ${isOutOfStock ? "grayscale" : ""}`} onError={(e) => { e.currentTarget.src = "/samruddhi-hero.png" }}/>
        {isOutOfStock && <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-sm font-bold uppercase tracking-wider text-white">Out of stock</span>}
      </div>
    </Link>
    <div className="flex flex-1 flex-col p-4">
      <Link to={`/products/${product.slug}`}>
        <h3 className="line-clamp-2 min-h-14 text-lg text-forest transition hover:text-clay">{product.name}</h3>
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <p className="font-display text-lg font-bold text-forest">{money(price)}</p>
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => add(product)}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-2 py-2 text-xs font-bold text-white transition hover:bg-clay disabled:cursor-not-allowed disabled:bg-gray-300"
          aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
        >
          {!isOutOfStock && <ShoppingCart size={15}/>}
          {isOutOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </div>
  </article>;
}
