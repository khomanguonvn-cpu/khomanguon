"use client";
import { IRootState } from "@/store";
import { FolderKanban, Home, Newspaper, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";

export default function MobileBottom() {
  const cart = useSelector((state: IRootState) => state.cart);
  return (
    <div className="bg-white z-[1000] w-full flex border-t border-slate-200 h-16 sm:h-20 px-4 sm:px-10 fixed shadow-lg bottom-0 left-0 lg:hidden">
      <div className="flex items-center justify-center gap-3 sm:gap-6 w-full">
        <Link
          href="/products"
          className="group flex flex-col gap-1 items-center justify-center"
        >
          <FolderKanban className="h-5 w-5 group-hover:text-primary-900 group-hover:font-bold" />
          <span>Danh mục</span>
        </Link>
        <Link
          href="/"
          className="group flex flex-col gap-1 items-center justify-center"
        >
          <Home className="h-5 w-5 group-hover:text-primary-900 group-hover:font-bold" />
          <span>Trang chủ</span>
        </Link>
        <Link
          href="/cart"
          className="group relative flex flex-col gap-1 items-center justify-center"
        >
          <ShoppingCart className="h-5 w-5 group-hover:text-primary-900 group-hover:font-bold" />
          <span className="absolute grid grid-place-content-center top-1 -right-1.5 bg-red-500 text-white rounded-full text-[10px] sm:text-sm w-4 h-4 sm:w-5 sm:h-5 text-center font-bold">
            {cart.cartItems.length > 99 ? "99+" : cart.cartItems.length}
          </span>
          <span>Giỏ hàng</span>
        </Link>
        <Link
          href="/tin-tuc"
          className="group flex flex-col gap-1 items-center justify-center"
        >
          <Newspaper className="h-5 w-5 group-hover:text-primary-900 group-hover:font-bold" />
          <span>Tin tức</span>
        </Link>
        <Link
          href="/signin"
          className="group flex flex-col gap-1 items-center justify-center"
        >
          <User className="h-5 w-5 group-hover:text-primary-900 group-hover:font-bold" />
          <span>Tài khoản</span>
        </Link>
      </div>
    </div>
  );
}
