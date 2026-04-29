"use client";
import { IRootState } from "@/store";
import { Home, ShoppingBag, Search, User, Grid3X3 } from "lucide-react";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import axios from "axios";

export default function MobileBottom() {
  const cart = useSelector((state: IRootState) => state.cart);
  const { status } = useSession();
  const pathname = usePathname();

  const tabs = [
    {
      href: "/",
      label: "Trang chủ",
      icon: Home,
      exact: true,
    },
    {
      href: "/products",
      label: "Sản phẩm",
      icon: ShoppingBag,
      badge: cart.cartItems.length > 0 ? cart.cartItems.length : undefined,
    },
    {
      href: "#search",
      label: "Tìm kiếm",
      icon: Search,
      isAction: true,
    },
    {
      href: "/categories",
      label: "Danh mục",
      icon: Grid3X3,
    },
    {
      href: status === "authenticated" ? "/account/profile" : "#auth",
      label: "Tài khoản",
      icon: User,
      isAuth: true,
    },
  ];

  const isActive = (tab: (typeof tabs)[0]) => {
    if (tab.isAction || tab.isAuth) return false;
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };

  const handleTabClick = (tab: (typeof tabs)[0], e: React.MouseEvent) => {
    if (tab.isAction) {
      e.preventDefault();
      window.dispatchEvent(new Event("open-mobile-search"));
      return;
    }
    if (tab.isAuth && status !== "authenticated") {
      e.preventDefault();
      window.dispatchEvent(new Event("open-auth-popup"));
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] lg:hidden">
      {/* Safe area padding for iOS */}
      <div className="bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-14 pb-safe">
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={(e) => handleTabClick(tab, e)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 relative transition-all duration-150",
                  active ? "text-primary-600" : "text-slate-500"
                )}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-600" />
                )}

                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-150",
                      active ? "stroke-[2.5px]" : "stroke-[1.5px]"
                    )}
                  />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none border-2 border-white">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium leading-none transition-all",
                    active ? "font-semibold text-primary-600" : "text-slate-500"
                  )}
                >
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
