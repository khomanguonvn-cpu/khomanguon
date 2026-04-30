"use client";
import { IRootState } from "@/store";
import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ── Pure SVG icons ──────────────────────────────────────────────────────────
const SvgHome = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor"
    strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    {active
      ? <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      : <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>
    }
  </svg>
);
const SvgBag = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor"
    strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    {active
      ? <path d="M19 7H5a1 1 0 00-1 1l1.5 10A2 2 0 007.5 20h9a2 2 0 001.98-1.68L20 8a1 1 0 00-1-1zm-7-5a3 3 0 00-3 3h6a3 3 0 00-3-3z" />
      : <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></>
    }
  </svg>
);
const SvgSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const SvgGrid = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor"
    strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    {active
      ? <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
      : <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>
    }
  </svg>
);
const SvgUser = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor"
    strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    {active
      ? <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
      : <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>
    }
  </svg>
);

export default function MobileBottom() {
  const cart = useSelector((state: IRootState) => state.cart);
  const { status } = useSession();
  const pathname = usePathname();

  const tabs = [
    { href: "/",        label: "Trang chủ", icon: SvgHome,   exact: true },
    { href: "/products",label: "Sản phẩm",  icon: SvgBag,    badge: cart.cartItems.length || undefined },
    { href: "#search",  label: "Tìm kiếm",  icon: SvgSearch, isAction: true },
    { href: "/products",label: "Danh mục",  icon: SvgGrid },
    {
      href: status === "authenticated" ? "/account/profile" : "#auth",
      label: "Tài khoản", icon: SvgUser, isAuth: true,
    },
  ];

  const isActive = (tab: typeof tabs[0]) => {
    if ("isAction" in tab || "isAuth" in tab) return false;
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };

  const handleTabClick = (tab: typeof tabs[0], e: React.MouseEvent) => {
    if ("isAction" in tab && tab.isAction) {
      e.preventDefault();
      window.dispatchEvent(new Event("open-mobile-search"));
      return;
    }
    if ("isAuth" in tab && tab.isAuth && status !== "authenticated") {
      e.preventDefault();
      window.dispatchEvent(new Event("open-auth-popup"));
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] lg:hidden">
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-14 pb-safe">
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href + tab.label}
                href={tab.href}
                onClick={(e) => handleTabClick(tab, e)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 relative transition-all duration-150",
                  active ? "text-primary-600" : "text-slate-400"
                )}
              >
                {/* Active top bar */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-600" />
                )}

                {/* Icon with badge */}
                <span className="relative">
                  <Icon active={active} />
                  {"badge" in tab && tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center px-1 leading-none border-2 border-white">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </span>

                <span className={cn(
                  "text-[10px] leading-none transition-all",
                  active ? "font-bold text-primary-600" : "font-medium text-slate-400"
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
