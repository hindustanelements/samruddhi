"use client";

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, Filter, RotateCcw } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { loadCategories, loadProducts, money } from "../lib/store";

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "";
  const query = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  const [maxPrice, setMaxPrice] = useState(5000);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    loadProducts(`/products?category=${encodeURIComponent(category)}&search=${encodeURIComponent(query)}&sort=${encodeURIComponent(sort)}`)
      .then((data) => {
        if (isMounted) setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Failed to load products:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [category, query, sort]);

  useEffect(() => {
    loadCategories().then(setCategories).catch(() => {});
  }, []);

  const handleCategoryChange = (newCategory) => {
    const newParams = new URLSearchParams(searchParams);
    if (newCategory) {
      newParams.set("category", newCategory);
    } else {
      newParams.delete("category");
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort) => {
    const newParams = new URLSearchParams(searchParams);
    if (newSort && newSort !== "newest") {
      newParams.set("sort", newSort);
    } else {
      newParams.delete("sort");
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setMaxPrice(5000);
    setInStockOnly(false);
  };

  const shown = products.filter((p) => {
    const price = Number(p.discountPrice || p.price);
    const matchesPrice = price <= maxPrice;
    const matchesStock = !inStockOnly || p.stock > 0;
    return matchesPrice && matchesStock;
  });

  const activeCategoryObj = categories.find((c) => c.slug === category);

  return (
    <main className="container-site py-12">
      <div className="rounded-[2rem] bg-forest px-7 py-10 text-white md:px-12">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-oat">The Samruddhi Pantry</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-display">
          {query ? `Results for “${query}”` : activeCategoryObj ? activeCategoryObj.name : "Pure choices for everyday living"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Naturally sourced foods and traditional kitchenware, packed carefully and delivered to your door.
        </p>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          <div className="flex items-center justify-between border-b border-forest/10 pb-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-forest">
              <Filter size={18} className="text-clay" /> Filters
            </h2>
            {(category || query || maxPrice < 5000 || inStockOnly) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-bold text-clay hover:underline"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm">
            <label className="block">
              <span className="mb-2 block font-sans text-xs font-bold uppercase tracking-wider text-forest">
                Category
              </span>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-forest/15 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-forest shadow-sm outline-none transition focus:border-forest cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c._count?.products || 0})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-forest/60" />
              </div>
            </label>
          </div>

          {/* Price Range Dropdown / Slider */}
          <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-forest">Price Up To</span>
              <span className="text-sm font-extrabold text-clay">{money(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-4 w-full accent-forest cursor-pointer"
            />
            <div className="mt-2 flex justify-between text-xs font-semibold text-ink/40">
              <span>₹100</span>
              <span>₹5,000+</span>
            </div>
          </div>

          {/* Availability Filter */}
          <div className="rounded-2xl border border-forest/10 bg-white p-4 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-forest cursor-pointer"
              />
              <span className="text-sm font-semibold text-forest">In Stock Only</span>
            </label>
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold text-ink/60">
              Showing <strong className="text-forest">{shown.length}</strong> {shown.length === 1 ? "product" : "products"}
            </p>
            <label className="relative flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink/50">Sort by:</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none rounded-full border border-forest/15 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-forest shadow-sm outline-none transition focus:border-forest cursor-pointer"
                >
                  <option value="newest">Newest first</option>
                  <option value="bestsellers">Best sellers</option>
                  <option value="price-low">Price: Low to high</option>
                  <option value="price-high">Price: High to low</option>
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-forest/60" />
              </div>
            </label>
          </div>

          {loading ? (
            <div className="py-24 text-center text-ink/40 font-semibold">Gathering the pantry...</div>
          ) : shown.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-forest/10 bg-white p-12 text-center">
              <p className="text-lg font-bold text-forest">No products match your filters.</p>
              <p className="mt-2 text-sm text-ink/50">Try broadening your search or resetting side filters.</p>
              <button
                onClick={clearFilters}
                className="btn-primary mt-6 inline-flex items-center gap-2"
              >
                <RotateCcw size={16} /> Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default Products;
