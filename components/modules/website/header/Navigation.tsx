"use client";
import React, { useState, useEffect } from "react";
import { TbCategory2, TbLayoutGrid } from "react-icons/tb";
import { ChevronDown, Zap, Home, ShoppingBag, BookOpen, Phone, Newspaper, Tag, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Category } from "@/types";
import axios from "axios";
import { usePathname } from "next/navigation";

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
    { name: "Tài khoản & License", href: "/products?category=tai-khoan", emoji: "🔑" },
    { name: "Mã nguồn", href: "/products?category=ma-nguon", emoji: "💻" },
    { name: "AI Tools", href: "/products?category=ai-tools", emoji: "🤖" },
    { name: "SaaS", href: "/products?category=saas", emoji: "☁️" },
    { name: "Game & MMO", href: "/products?category=game-mmo", emoji: "🎮" },
    { name: "Templates", href: "/products?category=template", emoji: "📐" },
  ];

  const navLinks = [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/products", label: "Sản phẩm", icon: ShoppingBag },
    { href: "/tin-tuc", label: "Tin tức", icon: Newspaper },
    { href: "/guide", label: "Hướng dẫn", icon: BookOpen },
    { href: "/contact", label: "Liên hệ", icon: Phone },
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
              <TbLayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">{t(language, "navCategories") || "Danh mục"}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", activeDropdown && "rotate-180")} />
            </button>

            {/* Dropdown */}
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
                            src={cat.image}
                            alt={cat.name}
                            className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                            width={32}
                            height={32}
                            unoptimized
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary-600">{cat.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="flex-1 font-medium">{cat.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                      </Link>
                    ))}
                    {categories.length === 0 && fallbackCats.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={() => setActiveDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-base">
                          {cat.emoji}
                        </div>
                        <span className="flex-1 font-medium">{cat.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                      </Link>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1 mx-2">
                      <Link
                        href="/products"
                        onClick={() => setActiveDropdown(false)}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        Xem tất cả sản phẩm
                        <ChevronRight className="h-4 w-4" />
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
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side badge */}
          <div className="hidden lg:flex items-center gap-2 ml-auto shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className="text-[11px] font-semibold text-amber-700">Giao hàng tự động 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
