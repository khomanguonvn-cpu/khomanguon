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

  return (
    <div className="relative lg:w-64 lg:shrink-0">
      <Button
        className="lg:hidden"
        type="button"
        variant="default"
        size="sm"
        onClick={() => setSidebar(!openSidebar)}
      >
        <AlignJustify />
      </Button>

      {/* Overlay for mobile */}
      {openSidebar && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-72 max-w-[88vw] transition-transform -translate-x-full lg:sticky lg:top-6 lg:h-auto lg:w-64 lg:max-w-none lg:translate-x-0",
          openSidebar && "translate-x-0"
        )}
        aria-label="sidebar"
      >
        <div className="h-full overflow-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:h-auto lg:max-h-[calc(100vh-3rem)]">
          <ul className="space-y-4 font-medium">
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <Image
                  width="56"
                  height="56"
                  alt={t(language, "sidebarAvatar")}
                  className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                  src={user?.image ? user.image : "https://cdn-icons-png.flaticon.com/128/236/236831.png"}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.name || t(language, "profileUserFallback")}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || "-"}</p>
                </div>
              </div>

              {user?.sellerVerification?.hasSellerAccount &&
                (user?.sellerVerification?.isVerified ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-xs text-blue-700">
                    <BadgeCheck className="h-4 w-4" />
                    <span>{t(language, "sidebarVerified")}</span>
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs text-red-700">
                    <ShieldAlert className="h-4 w-4" />
                    <span>{t(language, "sidebarNotVerified")}</span>
                  </div>
                ))}
            </li>

            <li>
              <button
                type="button"
                onClick={goToOrders}
                className={cn(
                  "w-full relative z-10 pointer-events-auto flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                  isItemActive("/account/order")
                    ? "border-primary-200 bg-primary-50 text-primary-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50"
                )}
              >
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  {t(language, "sidebarOrders")}
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </li>

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
                        "w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-sm transition-colors",
                        groupActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <GroupIcon className="h-4 w-4" />
                        {t(language, group.labelKey)}
                      </span>
                      {openGroups[group.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {openGroups[group.id] && (
                      <ul className="mt-1 pl-2 space-y-1">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const active = isItemActive(item.href);
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setSidebar(false)}
                                className={cn(
                                  "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors",
                                  active
                                    ? "bg-primary-100 text-primary-800"
                                    : "text-slate-700 hover:bg-slate-100"
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

            <li>
              <Button
                onClick={() => {
                  signOut();
                  router.push("/");
                }}
                className="w-full flex items-center justify-center"
              >
                <LogOut />
                <span className="ms-3">{t(language, "sidebarLogout")}</span>
              </Button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
