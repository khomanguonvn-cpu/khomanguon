"use client";
import { IRootState } from "@/store";
import { FolderKanban, Home, Newspaper, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";

export default function MobileBottom() {
  const cart = useSelector((state: IRootState) => state.cart);
  return (
    <div className="bg-white z-[1000] w-full flex border-t border-slate-200 h-16 sm:h-20 px-2 sm:px-10 fixed shadow-lg bottom-0 left-0 lg:hidden">
      <div className="flex items-center justify-between w-full h-full max-w-md mx-auto">
        <Link
          href="/products"
          className="group flex-1 flex flex-col gap-1 items-center justify-center text-slate-600 hover:text-primary-900"
        >
          <FolderKanban className="h-5 w-5 group-hover:font-bold" />
          <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Danh mục</span>
        </Link>
        <Link
          href="/"
          className="group flex-1 flex flex-col gap-1 items-center justify-center text-slate-600 hover:text-primary-900"
        >
          <Home className="h-5 w-5 group-hover:font-bold" />
          <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Trang chủ</span>
        </Link>
        <Link
          href="/cart"
          className="group relative flex-1 flex flex-col gap-1 items-center justify-center text-slate-600 hover:text-primary-900"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5 group-hover:font-bold" />
            <span className="absolute -top-1.5 -right-2 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center w-4 h-4 font-bold border border-white">
              {cart.cartItems.length > 99 ? "99+" : cart.cartItems.length}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Giỏ hàng</span>
        </Link>
        <Link
          href="/tin-tuc"
          className="group flex-1 flex flex-col gap-1 items-center justify-center text-slate-600 hover:text-primary-900"
        >
          <Newspaper className="h-5 w-5 group-hover:font-bold" />
          <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Tin tức</span>
        </Link>
        <Link
          href="/signin"
          className="group flex-1 flex flex-col gap-1 items-center justify-center text-slate-600 hover:text-primary-900"
        >
          <User className="h-5 w-5 group-hover:font-bold" />
          <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Tài khoản</span>
        </Link>
      </div>
    </div>
  );
}
