"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Leaf, Minus, Package, Plus, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useApp } from "../context/AppContext";
import { loadProduct, loadProducts, money } from "../lib/store";

function ProductDetails() {
  const pageSize = 24;
  const { slug } = useParams();
  const { add } = useApp();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [moreProducts, setMoreProducts] = useState([]);
  const [recommendationPage, setRecommendationPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreRecommendations, setHasMoreRecommendations] = useState(true);
  const recommendationsEndRef = useRef(null);

  useEffect(() => {
    let active = true;
    setProduct(null);
    setMoreProducts([]);
    setQty(1);
    setRecommendationPage(1);
    setHasMoreRecommendations(true);

    loadProduct(slug)
      .then((nextProduct) => {
        if (!active) return;
        setProduct(nextProduct);

        loadProducts(`/products?page=1&limit=${pageSize + 1}`)
          .then((products) => {
            if (!active) return;

            const loadedProducts = Array.isArray(products) ? products : [];
            const relatedProducts = loadedProducts.filter((item) => item.id !== nextProduct.id);
            setMoreProducts(relatedProducts.slice(0, pageSize));
            setHasMoreRecommendations(loadedProducts.length === pageSize + 1);
          })
          .catch(() => {
            if (active) setMoreProducts([]);
          });
      })
      .catch(() => navigate("/products"));

    return () => {
      active = false;
    };
  }, [slug, navigate]);

  useEffect(() => {
    const target = recommendationsEndRef.current;
    if (!target || loadingMore || !hasMoreRecommendations || !product) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const nextPage = recommendationPage + 1;
      setLoadingMore(true);
      loadProducts(`/products?page=${nextPage}&limit=${pageSize + 1}`)
        .then((products) => {
          const loadedProducts = Array.isArray(products) ? products : [];
          setMoreProducts((currentProducts) => {
            const existingIds = new Set(currentProducts.map((item) => item.id));
            const newProducts = loadedProducts.filter((item) => item.id !== product.id && !existingIds.has(item.id));
            return [...currentProducts, ...newProducts.slice(0, pageSize)];
          });
          setRecommendationPage(nextPage);
          setHasMoreRecommendations(loadedProducts.length === pageSize + 1);
        })
        .catch(() => setHasMoreRecommendations(false))
        .finally(() => setLoadingMore(false));
    }, { rootMargin: "300px" });

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadingMore, hasMoreRecommendations, recommendationPage, product]);

  if (!product) return <div className="container-site py-28 text-center">Loading product...</div>;

  const price = product.discountPrice || product.price;
  const isOutOfStock = Number(product.stock) <= 0;

  return <main className="container-site py-12">
    <div className="mb-7 text-xs text-ink/45"><Link to="/">Home</Link> / <Link to="/products">Products</Link> / {product.name}</div>
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[2rem] border border-forest/10 bg-white">
        <img src={product.image} alt={product.name} className={`block h-full w-full object-contain transition duration-500 ${isOutOfStock ? "grayscale filter" : ""}`} onError={(e) => { e.currentTarget.src = "/samruddhi-hero.png"; }}/>
        {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-black text-xl uppercase tracking-widest backdrop-blur-[2px]">Out of Stock</div>}
      </div>
      <div className="lg:py-5">
        <p className="eyebrow">{product.category.name}</p>
        <h1 className="mt-2 text-4xl text-forest md:text-5xl">{product.name}</h1>
        <div className="mt-4 flex items-center gap-2 text-xs"><span className="flex text-turmeric">{[1,2,3,4,5].map((i) => <Star key={i} size={15} fill="currentColor"/>)}</span><span className="text-ink/45">4.9</span></div>
        <p className="mt-6 text-3xl font-bold text-forest">{money(price)} {product.discountPrice && <span className="ml-2 text-base font-normal text-ink/35 line-through">{money(product.price)}</span>}</p>
        <p className="mt-1 text-md text-bold"> {product.weight}</p>
        <p className="mt-7 leading-7 text-ink/65">{product.description}</p>
        <div className="mt-7 flex items-center gap-3"></div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <div className={`flex h-12 items-center justify-between rounded-full border border-forest/15 bg-white px-3 sm:w-32 ${isOutOfStock ? "opacity-50 pointer-events-none" : ""}`}><button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={17}/></button><span className="font-bold">{qty}</span><button onClick={() => setQty(Math.min(product.stock, qty + 1))}><Plus size={17}/></button></div>
          <button disabled={isOutOfStock} onClick={() => add(product, qty)} className={`btn-primary flex-1 ${isOutOfStock ? "bg-gray-400 cursor-not-allowed opacity-70 hover:bg-gray-400" : ""}`}><ShoppingCart size={18}/> {isOutOfStock ? "Out of Stock" : "Add to basket"}</button>
          <button disabled={isOutOfStock} onClick={() => { add(product, qty); navigate("/checkout"); }} className={`btn-light flex-1 ${isOutOfStock ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300" : ""}`}>Buy now</button>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2">{[[Leaf,"Naturally sourced"],[ShieldCheck,"Quality assured"],[Truck,"Careful delivery"],[Package,"Freshly packed"]].map(([Icon, text]) => <div key={text} className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm font-semibold"><Icon size={19} className="text-clay"/>{text}</div>)}</div>
      </div>
    </div>
    <div className="mt-16 grid gap-5 md:grid-cols-3">{[["Why you'll love it", product.benefits], ["Our packing promise", "Packed in clean, food-safe materials and handled in small batches to preserve natural character."]].map(([title, body]) => <div key={title} className="card p-7"><h3 className="text-xl text-forest">{title}</h3><p className="mt-3 text-sm leading-6 text-ink/60">{body}</p></div>)}</div>

    {moreProducts.length > 0 && <section className="mt-16">
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">{moreProducts.map((item) => <ProductCard key={item.id} product={item}/>)}</div>
      <div ref={recommendationsEndRef} className="min-h-16 pt-8 text-center text-sm font-semibold text-ink/40" aria-live="polite">{loadingMore && "Gathering more products..."}</div>
    </section>}
  </main>;
}

export default ProductDetails;
