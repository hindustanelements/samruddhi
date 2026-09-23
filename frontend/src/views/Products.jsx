"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, RotateCcw } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { loadCategories, loadProducts } from "../lib/store";

function shuffleProducts(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function Products() {
  const pageSize = 24;
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  const category = searchParams.get("category") || "";
  const query = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams({ category, search: query, sort, page: "1", limit: String(pageSize) });
    if (inStockOnly) params.set("inStock", "true");
    setLoading(true);
    setPage(1);
    setHasMore(true);
    loadProducts(`/products?${params.toString()}`)
      .then((data) => {
        if (isMounted) {
          const loadedProducts = Array.isArray(data) ? data : [];
          setProducts(sort === "newest" ? shuffleProducts(loadedProducts) : loadedProducts);
          setHasMore(loadedProducts.length === pageSize);
        }
      })
      .catch((err) => console.error("Failed to load products:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [category, query, sort, inStockOnly]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || loading || loadingMore || !hasMore) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const nextPage = page + 1;
      const params = new URLSearchParams({
        category,
        search: query,
        sort,
        page: String(nextPage),
        limit: String(pageSize)
      });
      if (inStockOnly) params.set("inStock", "true");

      setLoadingMore(true);
      loadProducts(`/products?${params.toString()}`)
        .then((data) => {
          const loadedProducts = Array.isArray(data) ? data : [];
          setProducts((currentProducts) => [...currentProducts, ...loadedProducts]);
          setPage(nextPage);
          setHasMore(loadedProducts.length === pageSize);
        })
        .catch((err) => console.error("Failed to load more products:", err))
        .finally(() => setLoadingMore(false));
    }, { rootMargin: "300px" });

    observer.observe(target);
    return () => observer.disconnect();
  }, [category, query, sort, inStockOnly, loading, loadingMore, hasMore, page]);

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
    setInStockOnly(false);
  };

  const shown = products;

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

      <div className="mt-9">
          <div className="sticky top-[70px] z-30 -mx-4 mb-6 flex flex-col gap-3 border-b border-forest/10 bg-white/95 px-4 py-3 backdrop-blur md:top-[70px] md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-ink/60">
                Showing <strong className="text-forest">{shown.length}</strong> {shown.length === 1 ? "product" : "products"}
              </p>
              <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-forest">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-4 w-4 rounded accent-forest cursor-pointer"
                />
                In Stock Only
              </label>
            </div>
            <div className="grid w-full grid-cols-2 items-center gap-2 md:flex md:w-auto md:gap-3">
              <label className="relative block min-w-0">
                <div className="relative">
                  <select
                    aria-label="Filter by category"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full appearance-none rounded-full border border-forest/15 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-forest shadow-sm outline-none transition focus:border-forest cursor-pointer md:w-auto"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({c._count?.products || 0})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-forest/60" />
                </div>
              </label>
              <label className="relative block">
                <div className="relative">
                  <select
                    aria-label="Sort products"
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full appearance-none rounded-full border border-forest/15 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-forest shadow-sm outline-none transition focus:border-forest cursor-pointer md:w-auto"
                  >
                    <option value="newest">Newest first</option>
                    <option value="bestsellers">Best sellers</option>
                    <option value="price-low">Price: Low to high</option>
                    <option value="price-high">Price: High to low</option>
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-forest/60" />
                </div>
              </label>
              {(category || query || inStockOnly) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-bold text-clay hover:underline"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center text-ink/40 font-semibold">Gathering the pantry...</div>
          ) : shown.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div ref={loadMoreRef} className="min-h-16 pt-8 text-center text-sm font-semibold text-ink/40" aria-live="polite">
                {loadingMore && "Gathering more products..."}
              </div>
            </>
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
    </main>
  );
}

export default Products;
