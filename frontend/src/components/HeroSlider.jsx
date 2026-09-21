"use client";

import { Link } from "react-router-dom";

export default function HeroSlider({ slide, activeSlide }) {
  return <section className="relative min-h-[calc(70svh-76px)] overflow-hidden bg-forest md:min-h-[calc(100vh-108px)]">
    {activeSlide.slides.map((item, index) => <img key={item.id || item.title} src={item.image} alt={`${item.eyebrow} products`} className={`absolute inset-0 h-full w-full object-cover object-center transition duration-700 ${index === slide ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}/>)}
    <div className="absolute inset-0 bg-gradient-to-r from-[#142d20]/90 via-[#142d20]/50 to-black/10"/>
    <div className="absolute inset-0 hero-noise opacity-15"/>
    <div className="container-site relative flex min-h-[calc(70svh-76px)] items-center py-6 md:min-h-[calc(100vh-108px)] md:py-14">
      <div className="max-w-2xl text-white">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#f3c85d] md:mb-4 md:text-xs md:tracking-[.24em]">{activeSlide.eyebrow}</p>
        <h1 className="text-2xl leading-tight sm:text-5xl lg:text-6xl">{activeSlide.title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-5 text-white/80 md:mt-5 md:text-lg md:leading-7">{activeSlide.body}</p>
        <div className="mt-4 flex flex-wrap gap-1.5 md:mt-7 md:gap-2">{(activeSlide.highlights || []).map((item) => <span key={item} className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur ring-1 ring-white/20 md:px-4 md:py-2 md:text-xs">{item}</span>)}</div>
        <div className="mt-5 flex flex-wrap items-center gap-2 md:mt-8 md:gap-3">
          <Link to="/products" className="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-forest transition hover:-translate-y-1 md:px-7 md:py-3.5 md:text-sm">View all products</Link>
          <Link to={activeSlide.link || (activeSlide.category?.slug ? `/products?category=${activeSlide.category.slug}` : "/products")} className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20 md:px-7 md:py-3.5 md:text-sm">{activeSlide.cta || (activeSlide.category?.name ? `Shop ${activeSlide.category.name}` : "Shop category")}</Link>
        </div>
      </div>
    </div>
  </section>;
}
