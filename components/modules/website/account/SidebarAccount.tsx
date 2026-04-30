"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User as TUser } from "@/types";
import {
  AlignJustify,
  BadgeCheck,
  BadgeDollarSign,
  ChevronDown,
  ChevronRight,
  History,
  Landmark,
  LayoutDashboard,
  LogOut,
  Minus,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
  User,
  Wallet,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function SidebarAccount({ user }: { user: TUser }) {
  const [openSidebar, setSidebar] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: false,
    finance: false,
    security: false,
    seller: false,
    admin: false,
  });
  const [hash, setHash] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useSelector((state: IRootState) => state.settings);
  const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
  const hasSellerAccount = Boolean(user?.sellerVerification?.hasSellerAccount);

  const menuGroups = useMemo(
    () => [
      {
        id: "overview",
        labelKey: "sidebarGroupOverview" as const,
        icon: LayoutDashboard,
        items: [
          {
            href: "/account/dashboard",
            labelKey: "sidebarDashboard" as const,
            icon: LayoutDashboard,
          },
          {
            href: "/account/profile",
            labelKey: "sidebarProfile" as const,
            icon: User,
          },
        ],
      },
      {
        id: "finance",
        labelKey: "sidebarGroupFinance" as const,
        icon: Wallet,
        items: [
          {
            href: "/account/wallet",
            labelKey: "sidebarWallet" as const,
            icon: Wallet,
          },
          {
            href: "/account/wallet#deposit",
            labelKey: "sidebarDeposit" as const,
            icon: Plus,
          },
          {
            href: "/account/wallet#withdraw",
            labelKey: "sidebarWithdraw" as const,
            icon: Minus,
          },
          {
            href: "/account/bank",
            labelKey: "sidebarBank" as const,
            icon: Landmark,
          },
        ],
      },
      {
        id: "security",
        labelKey: "sidebarGroupSecurity" as const,
        icon: ShieldCheck,
        items: [
          {
            href: "/account/security",
            labelKey: "sidebarSecurity" as const,
            icon: ShieldCheck,
          },
          {
            href: "/account/kyc",
            labelKey: "sidebarKyc" as const,
            icon: ShieldCheck,
          },
        ],
      },
      {
        id: "seller",
        labelKey: "sidebarGroupSeller" as const,
        icon: Store,
        items: [
          {
            href: hasSellerAccount ? "/account/seller/products" : "/account/kyc",
            labelKey: hasSellerAccount ? ("sidebarSell" as const) : ("sidebarSellerRegister" as const),
            icon: Store,
          },
          ...(hasSellerAccount
            ? [
                {
                  href: "/account/seller/orders",
                  labelKey: "sidebarSellerOrders" as const,
                  icon: BadgeDollarSign,
                },
                {
                  href: "/account/seller/telegram",
                  labelKey: "sidebarSellerTelegram" as const,
                  icon: Store,
                },
              ]
            : []),
        ],
      },
      {
        id: "admin",
        labelKey: "sidebarGroupAdmin" as const,
        icon: Shield,
        visible: normalizedRole === "admin",
        items: [
          {
            href: "/admin",
            labelKey: "sidebarAdmin" as const,
            icon: Shield,
          },
        ],
      },
    ],
    [hasSellerAccount, normalizedRole]
  );

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash || "");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const isItemActive = (href: string) => {
    const [targetPath, targetHash] = href.split("#");
    if (pathname !== targetPath) return false;
    if (targetHash) return hash === `#${targetHash}`;
    return hash.length === 0;
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const goToOrders = () => {
    setSidebar(false);
    router.push("/account/order");
  };

  useEffect(() => {
    const activeGroup = menuGroups.find((group) =>
      group.items.some((item) => {
        const [targetPath, targetHash] = item.href.split("#");
        if (pathname !== targetPath) return false;
        if (targetHash) return hash === `#${targetHash}`;
        return hash.length === 0;
      })
    );
    if (!activeGroup) return;

    setOpenGroups((prev) => {
      if (prev[activeGroup.id]) return prev;
      return { ...prev, [activeGroup.id]: true };
    });
  }, [hash, menuGroups, pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (openSidebar) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [openSidebar]);

  return (
    <div className="relative w-full lg:w-72 lg:shrink-0">
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setSidebar(!openSidebar)}
        className="lg:hidden w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm shadow-sm transition-all hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <AlignJustify className="h-4 w-4" />
          Menu tài khoản
        </span>
        <ChevronRight className={cn("h-4 w-4 transition-transform", openSidebar && "rotate-90")} />
      </button>

      {/* Overlay for mobile */}
      {openSidebar && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-[calc(100%-56px)] w-80 max-w-[90vw] transition-transform duration-300 -translate-x-full lg:sticky lg:top-6 lg:h-auto lg:w-72 lg:max-w-none lg:translate-x-0",
          openSidebar && "translate-x-0"
        )}
        aria-label="sidebar"
      >
        <div className="h-full overflow-auto bg-white border-r border-slate-200 p-4 pb-safe"
        >
          {/* Mobile close button */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Tài khoản</span>
            <button onClick={() => setSidebar(false)} className="p-1.5 hover:bg-slate-100 transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <ul className="space-y-3 font-medium">
            {/* User card — angular */}
            <li
              className="border border-slate-200 bg-gradient-to-br from-slate-50 to-primary-50/30 p-4"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
            >
              <div className="flex items-center gap-3">
                <Image
                  width="56"
                  height="56"
                  alt={t(language, "sidebarAvatar")}
                  className="h-14 w-14 border-2 border-white object-cover shadow-md"
                  style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
                  src={user?.image ? user.image : "https://cdn-icons-png.flaticon.com/128/236/236831.png"}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.name || t(language, "profileUserFallback")}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || "-"}</p>
                </div>
              </div>

              {user?.sellerVerification?.hasSellerAccount &&
                (user?.sellerVerification?.isVerified ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 clip-angular-sm">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    <span>{t(language, "sidebarVerified")}</span>
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-red-700 bg-red-100 border border-red-200 clip-angular-sm">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>{t(language, "sidebarNotVerified")}</span>
                  </div>
                ))}
            </li>

            {/* Orders button — angular */}
            <li>
              <button
                type="button"
                onClick={goToOrders}
                className={cn(
                  "w-full relative z-10 pointer-events-auto flex items-center justify-between px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all clip-angular-sm",
                  isItemActive("/account/order")
                    ? "bg-primary-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-primary-50 hover:border-primary-200"
                )}
              >
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  {t(language, "sidebarOrders")}
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </li>

            {/* Menu groups */}
            {menuGroups
              .filter((group) => group.visible !== false)
              .map((group) => {
                const groupActive = group.items.some((item) => isItemActive(item.href));
                const GroupIcon = group.icon;

                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-all",
                        groupActive
                          ? "bg-primary-50 text-primary-700 border-l-2 border-primary-500"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <GroupIcon className="h-4 w-4" />
                        {t(language, group.labelKey)}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          !openGroups[group.id] && "-rotate-90"
                        )}
                      />
                    </button>

                    {openGroups[group.id] && (
                      <ul className="mt-1 ml-3 pl-3 border-l border-slate-200 space-y-0.5">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const active = isItemActive(item.href);
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setSidebar(false)}
                                className={cn(
                                  "flex items-center gap-2.5 px-3 py-2 text-sm transition-all",
                                  active
                                    ? "bg-primary-600 text-white font-bold clip-angular-sm"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                              >
                                <ItemIcon className="h-4 w-4" />
                                <span>{t(language, item.labelKey)}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}

            {/* Logout — angular */}
            <li className="pt-2">
              <button
                onClick={() => {
                  signOut();
                  router.push("/");
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-bold uppercase tracking-wider transition-all hover:bg-red-600 clip-angular"
              >
                <LogOut className="h-4 w-4" />
                <span>{t(language, "sidebarLogout")}</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
