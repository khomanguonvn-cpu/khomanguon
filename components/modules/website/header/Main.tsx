"use client";
import React, { useState, useEffect, useRef } from "react";
import Container from "../../custom/Container";
import IconsGroup from "../../custom/IconsGroup";
import Logo from "../../custom/Logo";
import { Search, X, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { useRouter } from "next/navigation";
// SearchProduct removed from import - using inline search results


export default function Main() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useSelector((state: IRootState) => state.settings);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await axios.get("/api/products", { params: { search: searchQuery } });
        setSearchResults(res.data?.products || res.data?.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "w-full bg-white transition-all duration-300 sticky top-0 z-50",
        scrolled ? "shadow-md" : "shadow-sm"
      )}
    >
      <Container className="h-14 sm:h-16 lg:h-[68px]">
        <div className="flex items-center justify-between h-full gap-3 lg:gap-6">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <Logo size="sm" />
          </div>

          {/* Search Bar — Desktop */}
          <div ref={searchRef} className="relative hidden lg:flex flex-1 max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div
                className={cn(
                  "flex items-center gap-2 w-full h-11 px-4 rounded-2xl border-2 bg-slate-50 transition-all duration-200",
                  searchFocused
                    ? "border-primary-500 bg-white shadow-lg shadow-primary-100"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={t(language, "searchPlaceholder") || "Tìm sản phẩm, danh mục..."}
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none min-w-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="shrink-0 ml-1 h-7 px-4 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors"
                >
                  Tìm
                </button>
              </div>
            </form>

            {/* Search Dropdown */}
            {searchFocused && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                    <span className="text-sm text-slate-500">Đang tìm kiếm...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-3 max-h-96 overflow-y-auto">
                    <p className="text-xs text-slate-400 font-medium px-2 mb-2">
                      {searchResults.length} kết quả
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {searchResults.slice(0, 8).map((product: any) => (
                        <Link
                          key={product._id || product.slug}
                          href={`/products/${product.slug}`}
                          onClick={() => { setSearchFocused(false); setSearchQuery(""); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <img
                              src={product.subProducts?.[0]?.options?.[0]?.images?.[0] || "/assets/images/placeholders/placeholder.png"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400">{product.category?.name || "Sản phẩm số"}</p>
                          </div>
                          <Search className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        </Link>
                      ))}
                    </div>
                    {searchResults.length > 0 && (
                      <Link
                        href={`/products?search=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setSearchFocused(false)}
                        className="flex items-center justify-center gap-2 mt-2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        Xem tất cả kết quả <Search className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-500">Không tìm thấy "{searchQuery}"</p>
                    <p className="text-xs text-slate-400 mt-1">Thử từ khóa khác</p>
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="text-xs text-slate-400 font-medium mb-3">Tìm kiếm phổ biến</p>
                    <div className="flex flex-wrap gap-2">
                      {["Tài khoản AI", "Mã nguồn", "ChatGPT", "SaaS", "MMO", "Templates"].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => { setSearchQuery(tag); inputRef.current?.focus(); }}
                          className="px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-colors font-medium"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile: Search Icon + Icons */}
          <div className="flex lg:hidden items-center gap-1">
            <button
              onClick={() => {
                setSearchFocused(true);
                // Open mobile search
                window.dispatchEvent(new Event("open-mobile-search"));
              }}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
              aria-label="Tìm kiếm"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Icons Group */}
          <div className="flex items-center gap-1 shrink-0">
            <IconsGroup />
          </div>
        </div>
      </Container>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay language={language} />
    </div>
  );
}

function MobileSearchOverlay({ language }: { language: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener("open-mobile-search", handler);
    return () => window.removeEventListener("open-mobile-search", handler);
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await axios.get("/api/products", { params: { search: query } });
        setResults(res.data?.products || res.data?.data || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery("");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setOpen(false); setQuery(""); }} />
      <div className="relative bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 h-14 border-b border-slate-200">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="flex-1 text-base text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
            autoFocus
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="p-1 text-slate-400">
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button type="button" onClick={() => { setOpen(false); setQuery(""); }} className="text-sm font-medium text-primary-600">
              Hủy
            </button>
          )}
        </form>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <span className="text-sm text-slate-500">Đang tìm...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="p-3 space-y-1">
              {results.slice(0, 10).map((p: any) => (
                <Link
                  key={p._id || p.slug}
                  href={`/products/${p.slug}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={p.subProducts?.[0]?.options?.[0]?.images?.[0] || "/assets/images/placeholders/placeholder.png"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.category?.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500">Không có kết quả cho "{query}"</p>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Phổ biến</p>
              <div className="flex flex-wrap gap-2">
                {["Tài khoản AI", "Mã nguồn", "ChatGPT", "Netflix", "SaaS", "MMO", "Canva Pro"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setQuery(tag); inputRef.current?.focus(); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors font-medium"
                  >
                    <Search className="h-3.5 w-3.5" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
