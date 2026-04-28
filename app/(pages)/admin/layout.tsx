"use client";
export const runtime = 'edge';
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Bell, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Gift,
  Image,
  FolderTree,
  Mail,
  Search,
  FileCheck,
  Wallet,
  WalletCards,
  CreditCard,
  Newspaper,
  Settings,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Bảng điều khiển", href: "/admin" },
  { icon: Package, label: "Sản phẩm", href: "/admin/products" },
  { icon: ShoppingCart, label: "Đơn hàng", href: "/admin/orders" },
  { icon: Users, label: "Người dùng", href: "/admin/users" },
  { icon: FileCheck, label: "KYC", href: "/admin/kyc" },
  { icon: Image, label: "Banner", href: "/admin/slides" },
  { icon: FolderTree, label: "Danh mục", href: "/admin/categories" },
  { icon: Tag, label: "Mã giảm giá", href: "/admin/coupons" },
  { icon: Gift, label: "VIP", href: "/admin/vip" },
  { icon: Wallet, label: "Số dư user", href: "/admin/wallet" },
  { icon: WalletCards, label: "Duyệt rút tiền", href: "/admin/withdrawals" },
  { icon: MessageCircle, label: "Chat", href: "/admin/chat" },
  { icon: Settings, label: "Cấu hình", href: "/admin/settings" },
  { icon: Mail, label: "Liên hệ", href: "/admin/contacts" },
  { icon: Search, label: "SEO", href: "/admin/seo" },
  { icon: CreditCard, label: "PayOS", href: "/admin/payos" },
  { icon: Shield, label: "Đăng nhập OAuth", href: "/admin/auth" },
  { icon: Newspaper, label: "Tin tức", href: "/admin/news" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 h-screen flex flex-col bg-slate-900 text-white transition-all duration-300 z-40",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-sm leading-tight">Quản trị</h2>
              <p className="text-xs text-slate-400">KHOMANGUON.IO.VN</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full p-2 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Thu gọn</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {navItems.find((n) => n.href === pathname)?.label || "Quản trị"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-700">A</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">Admin</p>
                <p className="text-xs text-slate-500">Quản trị viên</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
