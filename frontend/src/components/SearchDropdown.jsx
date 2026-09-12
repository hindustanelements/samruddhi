"use client";

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";

export default function SearchDropdown({ isMobile = false, onCloseMobile }) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Sync initial query from URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get("search") || "");
  }, [location.search]);

  // Debounced API fetch for trigram search suggestions
  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setSuggestions([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search/suggest?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setIsOpen(data.length > 0);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error("Search suggestion error:", err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProduct = (product) => {
    setIsOpen(false);
    setSearch(product.name);
    if (onCloseMobile) onCloseMobile();
    navigate(`/products/${product.slug}`);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const query = search.trim();
    if (onCloseMobile) onCloseMobile();

    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectProduct(suggestions[selectedIndex]);
      return;
    }

    const path = location.pathname.startsWith("/categories") ? "/categories" : "/products";
    const searchUrl = query ? `${path}?search=${encodeURIComponent(query)}` : path;
    setIsOpen(Boolean(query && suggestions.length > 0));
    navigate(searchUrl);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const searchIconClass = isMobile ? "text-ink/45" : "text-white/55";
  const clearButtonClass = isMobile ? "text-ink/45 hover:text-ink" : "text-white/60 hover:text-white";

  return (
    <div ref={containerRef} className={`relative ${isMobile ? "mb-4 w-full" : "hidden sm:block"}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${searchIconClass}`} size={15} />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search pantry products..."
          className={`${
            isMobile
              ? "w-full field text-sm pl-10 pr-9"
              : "w-40 rounded-full py-1.5 pl-9 pr-8 text-xs text-white placeholder:text-white/55 ring-1 ring-white/15 transition-all focus:w-48 focus:ring-amber-400/50 lg:w-48 lg:focus:w-56 xl:w-56 xl:focus:w-64"
          }`}
          style={{ background: "var(--color-nav-surface, rgba(255,255,255,0.1))" }}
          autoComplete="off"
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setSearch("");
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition ${clearButtonClass}`}
          >
            <X size={14} />
          </button>
        )}
      </form>

      {/* YouTube-Style Text Dropdown (Product Names Only) */}
      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-xl border border-white/15 bg-neutral-900/95 shadow-2xl backdrop-blur-md transition-all"
          style={{ minWidth: isMobile ? "100%" : "260px" }}
        >
          <ul className="py-1.5 text-xs text-neutral-200">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li
                  key={item.id}
                  onClick={() => handleSelectProduct(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-amber-500/20 text-amber-300 font-medium"
                      : "hover:bg-white/10 text-neutral-200"
                  }`}
                >
                  <Search className={`shrink-0 ${isSelected ? "text-amber-400" : "text-neutral-400"}`} size={14} />
                  <span className="truncate">{item.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
