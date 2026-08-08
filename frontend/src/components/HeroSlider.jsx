"use client";

import { Link } from "react-router-dom";

export default function HeroSlider({ slide, activeSlide }) {
  return <section className="relative min-h-[calc(100vh-108px)] overflow-hidden bg-forest">
    {activeSlide.slides.map((item, index) => <img key={item.id || item.title} src={item.image} alt={`${item.eyebrow} products`} className={`absolute inset-0 h-full w-full object-cover object-center transition duration-700 ${index === slide ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}/>)}
    <div className="absolute inset-0 bg-gradient-to-r from-[#142d20]/90 via-[#142d20]/50 to-black/10"/>
    <div className="absolute inset-0 hero-noise opacity-15"/>
    <div className="container-site relative flex min-h-[calc(100vh-108px)] items-center py-14">
      <div className="max-w-2xl text-white">
        <p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-[#f3c85d]">{activeSlide.eyebrow}</p>
        <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">{activeSlide.title}</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/80 md:text-lg">{activeSlide.body}</p>
        <div className="mt-7 flex flex-wrap gap-2">{(activeSlide.highlights || []).map((item) => <span key={item} className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur ring-1 ring-white/20">{item}</span>)}</div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/products" className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-forest transition hover:-translate-y-1">View all products</Link>
          <Link to={activeSlide.link || (activeSlide.category?.slug ? `/products?category=${activeSlide.category.slug}` : "/products")} className="rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">{activeSlide.cta || (activeSlide.category?.name ? `Shop ${activeSlide.category.name}` : "Shop category")}</Link>
        </div>
      </div>
    </div>
  </section>;
}
