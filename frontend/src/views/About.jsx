"use client";

import { Leaf, Package, Store } from "lucide-react";
import { Link } from "react-router-dom";
import ContactSection from "../components/ContactSection";

export default function About() {
  return <main>
    <section className="relative min-h-[520px] overflow-hidden bg-forest text-white">
      <img src="/samruddhi-hero.png" alt="Samruddhi natural pantry collection" className="absolute inset-0 h-full w-full object-cover opacity-45"/>
      <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/75 to-forest/15"/>
      <div className="container-site relative flex min-h-[520px] items-center py-16">
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.22em] text-oat">About Samruddhi</p><h1 className="mt-4 text-5xl leading-tight md:text-6xl">From farm to kitchen, with honest care.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">Samruddhi brings natural pantry essentials, premium dry fruits, ancient millets, cold pressed oils, spices and traditional mitti cookware into one thoughtful store for everyday Indian homes.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/products" className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-forest">Shop products</Link><Link to="/categories" className="rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur">View categories</Link></div></div>
      </div>
    </section>
    <section className="container-site grid gap-10 py-16 lg:grid-cols-[1fr_1.1fr]"><div><p className="eyebrow">Our purpose</p><h2 className="section-title">A pantry that feels closer to nature and home.</h2></div><div className="space-y-5 leading-8 text-ink/60"><p>We choose products that belong in real kitchens: staples for daily cooking, dry fruits for family snacking and gifting, millets for nourishing meals, oils with natural character, and clay cookware that rewards slower preparation.</p><p>Our focus is simple: useful products, careful packing, clear information and service that helps customers buy with confidence.</p></div></section>
    <section className="bg-white py-16"><div className="container-site grid gap-5 md:grid-cols-3">{[[Leaf,"Natural choices","Products selected for cleaner everyday cooking and traditional Indian food habits."],[Package,"Freshly packed","Small batches and careful handling so pantry staples arrive ready for your home."],[Store,"Rooted in India","Millets, spices, cashews, dry fruits and mitti cookware chosen for how Indian homes cook, store and serve."]].map(([Icon,title,body])=><div key={title} className="rounded-[1.5rem] border border-forest/10 bg-cream p-7"><Icon className="text-clay" size={30}/><h3 className="mt-6 text-2xl text-forest">{title}</h3><p className="mt-3 text-sm leading-6 text-ink/55">{body}</p></div>)}</div></section>
    <section className="container-site py-16"><div className="grid overflow-hidden rounded-[2rem] bg-forest lg:grid-cols-2"><img src="/slide-mitti-products.png" alt="Mitti cookware and natural pantry products" className="h-full min-h-80 w-full object-cover"/><div className="p-8 text-white md:p-12"><p className="text-xs font-bold uppercase tracking-[.2em] text-oat">What we offer</p><h2 className="mt-3 text-4xl">Wholesome shelves for everyday families.</h2><div className="mt-7 grid gap-3 text-sm text-white/75 sm:grid-cols-2">{["Organic staples","Dry fruits","Premium cashews","Ancient millets","Cold pressed oils","Mitti cookware"].map(item=><span key={item} className="rounded-full bg-white/10 px-4 py-3 ring-1 ring-white/15">{item}</span>)}</div></div></div></section>
    <ContactSection/>
  </main>;
}
