"use client";
import React, { useState, useEffect } from "react";
import { TbCategory2 } from "react-icons/tb";
import { ChevronDown, Zap } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getCategories = async () => {
      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data.data || []);
      } catch {
        // Lỗi tải dữ liệu
      }
    };
    getCategories();
  }, []);

  const fallbackCats = [
    { name: t(language, "navAccountLicense"), href: "/products?category=tai-khoan" },
    { name: t(language, "navSourceCode"), href: "/products?category=ma-nguon" },
    { name: t(language, "navAiTools"), href: "/products?category=ai-tools" },
    { name: t(language, "navSaaS"), href: "/products?category=saas" },
    { name: t(language, "navGameMmo"), href: "/products?category=game-mmo" },
    { name: t(language, "navTemplate"), href: "/products?category=template" },
  ];

  const navLinks = [
    { href: "/", label: t(language, "navHome") },
    { href: "/products", label: t(language, "navProducts") },
    { href: "/tin-tuc", label: t(language, "navNews") },
    { href: "/guide", label: t(language, "navGuide") },
    { href: "/contact", label: t(language, "navContact") },
  ];

  return (
    <div
      className={cn(
        "w-full bg-white transition-all duration-300 sticky top-0 z-40",
        scrolled && "shadow-md"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12 lg:h-14 gap-4">
          {/* Category Dropdown */}
          <div className={cn("relative", isHomePage && "lg:hidden")}>
            <button
              onClick={() => setActiveDropdown(!activeDropdown)}
              aria-expanded={activeDropdown}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                "bg-primary-600 text-white hover:bg-primary-700",
                activeDropdown && "bg-primary-700"
              )}
            >
              <TbCategory2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t(language, "navCategories")}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  activeDropdown && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {activeDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in-scale">
                <div className="py-2 max-h-[420px] overflow-y-auto">
                  {categories.length > 0 ? (
                    categories.map((cat, idx) => (
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
                            className="w-9 h-9 rounded-lg object-cover bg-slate-100"
                            width={36}
                            height={36}
                            unoptimized
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary-600">
                              {cat.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="flex-1">{cat.name}</span>
                      </Link>
                    ))
                  ) : (
                    <>
                      {fallbackCats.map((cat) => (
                        <Link
                          key={cat.href}
                          href={cat.href}
                          onClick={() => setActiveDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary-600">
                              {cat.name.charAt(0)}
                            </span>
                          </div>
                          <span className="flex-1">{cat.name}</span>
                        </Link>
                      ))}
                    </>
                  )}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <Link
                      href="/products"
                      onClick={() => setActiveDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      {t(language, "navSeeAllProducts")}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Click overlay to close */}
            {activeDropdown && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setActiveDropdown(false)}
              />
            )}
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auto Digital Delivery Badge */}
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">
                {t(language, "autoDigitalDelivery")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
