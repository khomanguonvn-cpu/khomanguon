"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Category } from "@/types";
import axios from "axios";
import { usePathname } from "next/navigation";

// ── Inline SVG icons (zero extra dep) ─────────────────────────────────────────
const SvgHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const SvgBag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const SvgNews = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a4 4 0 01-4-4V6" />
    <path d="M2 6h4" /><line x1="10" y1="8" x2="18" y2="8" /><line x1="10" y1="12" x2="16" y2="12" />
  </svg>
);
const SvgBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);
const SvgPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.64A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.07 6.07l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);
const SvgGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);
const SvgChevronDown = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
    className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const SvgChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-slate-300">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const SvgZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-amber-500">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// SVG icons for fallback category items
const CategoryIcons: Record<string, React.ReactNode> = {
  "Tài khoản & License": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary-600">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  "Mã nguồn": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-violet-600">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  "AI Tools": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-cyan-600">
      <path d="M12 2a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2z" />
      <path d="M12 16a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2v-2a2 2 0 012-2z" />
      <path d="M4 9a2 2 0 012-2h2a2 2 0 012 2 2 2 0 01-2 2H6a2 2 0 01-2-2z" />
      <path d="M16 9a2 2 0 012-2h2a2 2 0 012 2 2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  "SaaS": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-sky-600">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  ),
  "Game & MMO": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-600">
      <rect x="2" y="6" width="20" height="12" rx="2" /><line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="16" cy="11" r="1" fill="currentColor" /><circle cx="18" cy="13" r="1" fill="currentColor" />
    </svg>
  ),
  "Templates": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-orange-600">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
};

export default function Navigation() {
  const { language } = useSelector((state: IRootState) => state.settings);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const getCategories = async () => {
      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data.data || []);
      } catch {
        // silence
      }
    };
    getCategories();
  }, []);

  const fallbackCats = [
    { name: "Tài khoản & License", href: "/products?category=tai-khoan" },
    { name: "Mã nguồn",           href: "/products?category=ma-nguon" },
    { name: "AI Tools",           href: "/products?category=ai-tools" },
    { name: "SaaS",               href: "/products?category=saas" },
    { name: "Game & MMO",         href: "/products?category=game-mmo" },
    { name: "Templates",          href: "/products?category=template" },
  ];

  const navLinks = [
    { href: "/",         label: t(language, "navHome") || "Trang chủ", icon: <SvgHome /> },
    { href: "/products", label: t(language, "navProducts") || "Sản phẩm", icon: <SvgBag /> },
    { href: "/tin-tuc",  label: "Tin tức",   icon: <SvgNews /> },
    { href: "/guide",    label: t(language, "navGuide") || "Hướng dẫn", icon: <SvgBook /> },
    { href: "/contact",  label: t(language, "navContact") || "Liên hệ", icon: <SvgPhone /> },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="w-full bg-white border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-11 lg:h-12 gap-1">

          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(!activeDropdown)}
              aria-expanded={activeDropdown}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 h-9",
                "bg-primary-600 text-white hover:bg-primary-700 active:scale-95",
                activeDropdown && "bg-primary-700"
              )}
            >
              <SvgGrid />
              <span className="hidden sm:inline">{t(language, "navCategories") || "Danh mục"}</span>
              <SvgChevronDown open={activeDropdown} />
            </button>

            {activeDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-50">
                  <div className="py-2 max-h-[70vh] overflow-y-auto custom-scroll">
                    {(categories.length > 0 ? categories : []).map((cat, idx) => (
                      <Link
                        key={cat._id || `cat-${idx}`}
                        href={`/categories/${cat.slug}/products`}
                        onClick={() => setActiveDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        {cat.image ? (
                          <Image
                            src={cat.image} alt={cat.name}
                            className="w-7 h-7 rounded-lg object-cover bg-slate-100 shrink-0"
                            width={28} height={28} unoptimized
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black text-primary-600">{cat.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="flex-1 font-medium">{cat.name}</span>
                        <SvgChevronRight />
                      </Link>
                    ))}

                    {categories.length === 0 && fallbackCats.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={() => setActiveDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {CategoryIcons[cat.name] || (
                            <span className="text-xs font-bold text-slate-500">{cat.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="flex-1 font-medium">{cat.name}</span>
                        <SvgChevronRight />
                      </Link>
                    ))}

                    <div className="border-t border-slate-100 mt-1 pt-1 mx-2">
                      <Link
                        href="/products"
                        onClick={() => setActiveDropdown(false)}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        Xem tất cả sản phẩm
                        <SvgChevronRight />
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap",
                  isActive(link.href)
                    ? "text-primary-600 bg-primary-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <span className={isActive(link.href) ? "text-primary-600" : "text-slate-400"}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right badge */}
          <div className="hidden lg:flex items-center gap-2 ml-auto shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
              <SvgZap />
              <span className="text-[11px] font-semibold text-amber-700">Giao hàng tự động 24/7</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
