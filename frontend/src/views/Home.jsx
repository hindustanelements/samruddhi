"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Leaf, Store, Wheat } from "lucide-react";
import ProductCard from "../components/ProductCard";
import SectionHead from "../components/SectionHead";
import { loadCategories, loadHomeSettings, loadProducts } from "../lib/store";

function sortAvailableFirst(items) {
  return [...items].sort((a, b) => (Number(b.stock) > 0 ? 1 : 0) - (Number(a.stock) > 0 ? 1 : 0));
}


function Home() {
  const pageSize = 24;
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(0);
  //const [slides, setSlides] = useState(fallbackHomeSlides);
  const [homeSettings, setHomeSettings] = useState({showcaseCategoryId:null, storeOpen:true});
  const [showcaseProducts, setShowcaseProducts] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const productsEndRef = useRef(null);
  const categoryBarRef = useRef(null);
  const categoryMeasureRef = useRef(null);
  //const activeSlide = { ...slides[slide], slides };
  const showcaseCategory = categories.find((c) => c.id === homeSettings.showcaseCategoryId) || categories.find((c) => c.slug === "mitti-cookware") || categories.find((c) => products.some((p) => p.category?.id === c.id));
  const moreCategories = visibleCategoryCount < categories.length ? categories.slice(visibleCategoryCount) : categories;
  useEffect(() => {
    if (!showcaseCategory) {
      setShowcaseProducts([]);
      return undefined;
    }
    let active = true;
    loadProducts(`/products?category=${encodeURIComponent(showcaseCategory.slug)}&sort=stock&inStock=true&page=1&limit=20`)
      .then((items) => {
        if (active) setShowcaseProducts(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (active) setShowcaseProducts([]);
      });
    return () => {
      active = false;
    };
  }, [showcaseCategory?.slug]);
  useEffect(() => {
    loadProducts(`/products?sort=stock&page=1&limit=${pageSize}`)
      .then((items) => {
        const loadedProducts = Array.isArray(items) ? items : [];
        setProducts(sortAvailableFirst(loadedProducts));
        setHasMore(loadedProducts.length === pageSize);
      })
      .catch(() => setHasMore(false));
    loadCategories().then(setCategories);
    loadHomeSettings().then(setHomeSettings).catch(()=>{});
  }, []);
  useEffect(() => {
    const target = productsEndRef.current;
    if (!target || loadingMore || !hasMore) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const nextPage = page + 1;
      setLoadingMore(true);
      loadProducts(`/products?sort=stock&page=${nextPage}&limit=${pageSize}`)
        .then((items) => {
          const loadedProducts = Array.isArray(items) ? items : [];
          setProducts((currentProducts) => sortAvailableFirst([...currentProducts, ...loadedProducts]));
          setPage(nextPage);
          setHasMore(loadedProducts.length === pageSize);
        })
        .catch(() => setHasMore(false))
        .finally(() => setLoadingMore(false));
    }, { rootMargin: "300px" });

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadingMore, hasMore, page]);
  useEffect(() => {
    const bar = categoryBarRef.current;
    const measure = categoryMeasureRef.current;
    if (!bar || !measure || !categories.length) {
      setVisibleCategoryCount(0);
      return undefined;
    }

    const updateVisibleCount = () => {
      const availableWidth = bar.clientWidth;
      if (!availableWidth) return;

      const categoryWidths = [...measure.querySelectorAll("[data-category-measure]")]
        .map((item) => item.getBoundingClientRect().width);
      const moreWidths = [...measure.querySelectorAll("[data-category-more]")]
        .map((item) => item.getBoundingClientRect().width);
      const moreWidth = Math.max(...moreWidths, 0);
      const gap = Number.parseFloat(window.getComputedStyle(measure).columnGap) || 0;

      let usedWidth = 0;
      let count = 0;
      for (let index = 0; index < categoryWidths.length; index += 1) {
        const nextWidth = usedWidth + (count ? gap : 0) + categoryWidths[index];
        const needsMoreButton = index < categoryWidths.length - 1;
        const reservedWidth = needsMoreButton ? gap + moreWidth : 0;
        if (nextWidth + reservedWidth > availableWidth) break;
        usedWidth = nextWidth;
        count += 1;
      }

      setVisibleCategoryCount(count);
      if (count === categories.length) setShowAllCategories(false);
    };

    updateVisibleCount();
    const observer = new ResizeObserver(updateVisibleCount);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [categories]);
  // useEffect(() => {
  //   const timer = setInterval(() => setSlide((current) => (current + 1) % slides.length), 4500);
  //   return () => clearInterval(timer);
  // }, [slides.length]);
  return <main>
    {!homeSettings.storeOpen && <div className="bg-clay px-1 py-1 text-center text-sm font-bold text-white">🙏 Store was closed 🙏</div>}
    {/* <HeroSlider slide={slide} activeSlide={activeSlide}/> */}

    {/* <section className="border-b border-forest/10 bg-white py-7"><div className="container-site grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[
      [Leaf,"Natural clay craft","Hand-finished kitchenware"],[ShieldCheck,"Clean pantry","No needless additives"],[Package,"Freshly packed","Small batches, careful handling"],[Clock3,"Tradition first","Millets, cashews and clay"]
    ].map(([I,t,d])=><div key={t} className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-cream text-leaf"><I size={20}/></span><div><strong className="text-sm text-forest">{t}</strong><p className="text-xs text-ink/50">{d}</p></div></div>)}</div></section> */}

    <section className="container-site mt-2 py-1">
      <div ref={categoryBarRef} className="flex min-w-0 items-center gap-5 whitespace-nowrap">
        {categories.slice(0, visibleCategoryCount).map((category) => (
          <Link
            key={category.id}
            to={`/products?category=${category.slug}`}
            className="shrink-0 text-sm font-medium text-ink/70 transition-colors hover:text-forest"
          >
            {category.name}
          </Link>
        ))}
        {categories.length > 0 && <div className="relative ml-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowAllCategories((open) => !open)}
            aria-expanded={showAllCategories}
            aria-controls="all-home-categories"
            className="inline-flex items-center gap-1 text-sm font-bold text-forest hover:text-leaf"
          >
            {showAllCategories ? "View less" : "View more"}
            <ChevronDown size={16} className={`transition-transform ${showAllCategories ? "rotate-180" : ""}`}/>
          </button>
          {showAllCategories && <div id="all-home-categories" className="absolute right-0 top-full z-40 mt-2 flex max-h-72 w-56 max-w-[calc(100vw-2rem)] flex-col overflow-x-hidden overflow-y-auto rounded-xl border border-forest/10 bg-white p-2 shadow-soft">
            {moreCategories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                onClick={() => setShowAllCategories(false)}
                className="truncate rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-cream hover:text-forest"
              >
                {category.name}
              </Link>
            ))}
          </div>}
        </div>}
      </div>
      <div ref={categoryMeasureRef} aria-hidden="true" className="pointer-events-none invisible fixed left-0 top-0 -z-10 flex w-max items-center gap-5 whitespace-nowrap">
        {categories.map((category) => <span key={category.id} data-category-measure className="shrink-0 text-sm font-medium">{category.name}</span>)}
        <span data-category-more className="shrink-0 text-sm font-bold">View more</span>
        <span data-category-more className="shrink-0 text-sm font-bold">View less</span>
      </div>
    </section>

    {showcaseProducts.length > 0 && <section className="bg-white py-5"><div className="container-site">
      <SectionHead eyebrow={showcaseCategory.name} title={`${showcaseCategory.name} products`} link={`/products?category=${showcaseCategory.slug}`}/>
      <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-6">{showcaseProducts.map((p)=><ProductCard key={p.id} product={p}/>)}</div>
      <div className="mt-5 flex justify-center"><Link to={`/products?category=${showcaseCategory.slug}`} className="btn-light">View More Products</Link></div>
    </div></section>}

    <section><div className="container-site"><SectionHead eyebrow="Products" title="" body="Fresh picks our community returns to, week after week." link="/products"/><div className="grid grid-cols-2 gap-5 md:grid-cols-4 lg:grid-cols-6">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div><div ref={productsEndRef} className="min-h-8 pt-4 text-center text-sm font-semibold text-ink/40" aria-live="polite">{loadingMore && "Gathering more products..."}</div></div></section>

    {/* <section className="container-site py-20">
      <div className="grid overflow-hidden rounded-[2rem] bg-forest lg:grid-cols-2">
        <div className="p-9 text-white md:p-14"><p className="eyebrow !text-[#f3c85d]">Ancient grains, everyday ease</p><h2 className="mt-3 text-4xl md:text-5xl">Make room for mighty millets.</h2><p className="mt-5 max-w-lg leading-7 text-white/70">Nutritious, climate-friendly and wonderfully versatile. Reimagine familiar meals with foxtail, little, barnyard and kodo millet.</p><Link to="/products?category=millets" className="mt-8 inline-flex items-center gap-2 border-b border-white pb-1 text-sm font-bold">Explore millets <ArrowRight size={16}/></Link></div>
        <div className="relative min-h-80"><img src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85" alt="Wholesome millets and grains" className="absolute inset-0 h-full w-full object-cover"/></div>
      </div>
    </section> */}

    <section className="container-site py-20"><SectionHead eyebrow="Why Samruddhi" title="Simple promises, kept well"/><div className="grid gap-5 md:grid-cols-3">{[
      [Wheat,"Farm-sourced quality","We work with trusted growers and makers who value soil, season and honest craft."],
      [Leaf,"Naturally better","A pantry built around pure ingredients, ancient grains and minimal processing."],
      [Store,"Indian kitchen wisdom","Traditional ingredients and vessels chosen for the way our homes really cook."]
    ].map(([I,t,d])=><div key={t} className="rounded-[1.75rem] border border-forest/10 bg-white p-8"><I className="text-clay" size={30}/><h3 className="mt-7 text-2xl text-forest">{t}</h3><p className="mt-3 text-sm leading-6 text-ink/55">{d}</p></div>)}</div></section>

    {/* <section className="bg-oat py-20"><div className="container-site"><SectionHead eyebrow="Kind words" title="From kitchens like yours"/><div className="grid gap-5 md:grid-cols-3">{[
      ["The cashews were genuinely fresh and creamy. Even the packaging felt thoughtful.","Ananya Rao","Bengaluru"],
      ["My clay handi has changed Sunday dal entirely—slow, earthy and worth the little ritual.","Meera Kulkarni","Pune"],
      ["Millets that are clean, easy to cook and actually taste lovely. I keep coming back.","Rohan Shah","Mumbai"]
    ].map(([q,n,c])=><blockquote key={n} className="rounded-[1.75rem] bg-white p-7"><div className="flex text-turmeric">{[1,2,3,4,5].map(i=><Star key={i} size={15} fill="currentColor"/>)}</div><p className="mt-5 font-display text-xl leading-8 text-forest">“{q}”</p><footer className="mt-6 text-xs"><strong>{n}</strong><span className="text-ink/45"> · {c}</span></footer></blockquote>)}</div></div></section> */}

    {/* <Newsletter/> */}
  </main>;
}

// function Newsletter() {
//   const [done,setDone]=useState(false);
//   return <section className="container-site py-20"><div className="relative overflow-hidden rounded-[2rem] bg-clay px-7 py-14 text-center text-white md:px-14"><Leaf className="absolute -left-10 -top-10 h-40 w-40 rotate-12 text-white/5"/><p className="text-xs font-bold uppercase tracking-[.22em] text-oat">A little goodness in your inbox</p><h2 className="mt-3 text-3xl md:text-4xl">Recipes, rituals & fresh arrivals.</h2><p className="mx-auto mt-3 max-w-lg text-sm text-white/70">Join our table for practical millet recipes, clay-pot care and member-only offers.</p>{done?<p className="mt-7 font-bold">You’re on the list. Welcome to the table!</p>:<form onSubmit={(e)=>{e.preventDefault();setDone(true)}} className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row"><input required type="email" className="min-w-0 flex-1 rounded-full bg-white px-5 py-3 text-sm text-ink" placeholder="Your email address"/><button className="rounded-full bg-forest px-6 py-3 text-sm font-bold">Subscribe</button></form>}</div></section>;
// }

export default Home;
