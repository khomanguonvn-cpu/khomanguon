"use client";
import { IRootState } from "@/store";
import { updateCart } from "@/store/cartSlice";
import { CartItem as TCartItem } from "@/types";
import React from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import Toast from "../../custom/Toast";
import Link from "next/link";
import Image from "next/image";
import QuantityCart from "../../custom/QuantityCart";
import { Trash2 } from "lucide-react";
import { t } from "@/lib/i18n";
import CurrencyFormat from "../../custom/CurrencyFormat";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";

export default function CartItem({ item }: { item: TCartItem }) {
  const cart = useSelector((state: IRootState) => state.cart);
  const { language } = useSelector((state: IRootState) => state.settings);

  const dispatch = useDispatch();
  const handleRemoveItem = () => {
    const newCart = cart.cartItems.filter((p: TCartItem) => p._uid !== item._uid);
    dispatch(updateCart(newCart));

    toast.custom(
      <Toast
        message={t(language, "cartRemovedItem")}
        status="success"
      />
    );
  };

  const lineTotal = item.price * item.qty;

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      layout
      className="group rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 md:p-5 hover:shadow-sm transition-all duration-200 overflow-hidden relative"
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-indigo-500 rounded-l-2xl hidden sm:block" />

      {/* Mobile: stacked layout */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 pl-2 sm:pl-3">
        {/* Product Image */}
        <Link className="shrink-0 self-center sm:self-auto" href={`/products/${item.slug}`}>
          <m.div
            whileTap={{ scale: 0.97 }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm"
          >
            <Image
              src={item.images?.[0] || "/assets/images/placeholders/placeholder.png"}
              alt={item.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </m.div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
          <Link
            href={`/products/${item.slug}`}
            className="block font-bold text-slate-800 text-sm leading-snug hover:text-primary-600 transition-colors line-clamp-2"
          >
            {item.name}
          </Link>

          {/* Attributes */}
          {item.attributes && item.attributes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.attributes.map((attr, idx) => (
                <span
                  key={`${attr.key}-${idx}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] sm:text-xs text-slate-600 font-medium"
                >
                  <span className="text-slate-400">{attr.key}:</span>
                  <span className="font-semibold text-slate-700">{String(attr.value)}</span>
                </span>
              ))}
            </div>
          )}

          {/* Variant ID */}
          {item.selectedVariantId && (
            <div className="text-[11px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded w-fit">
              {t(language, "orderVariantId")}: {item.selectedVariantId}
            </div>
          )}
        </div>

        {/* Bottom row: quantity, price, remove */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          {/* Quantity */}
          <div className="shrink-0">
            <QuantityCart item={item} />
          </div>

          {/* Price */}
          <div className="shrink-0 text-right">
            <m.div
              key={lineTotal}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-base sm:text-lg font-extrabold text-slate-900"
            >
              <CurrencyFormat value={lineTotal} />
            </m.div>
            {item.qty > 1 && (
              <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                <CurrencyFormat value={item.price} /> x {item.qty}
              </div>
            )}
          </div>

          {/* Remove Button */}
          <m.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRemoveItem}
            className="shrink-0 p-2 sm:p-2.5 rounded-xl border-2 text-slate-400 hover:text-white hover:border-red-500 hover:bg-red-500 transition-all duration-200 shadow-sm"
            aria-label={t(language, "cartRemoveItem")}
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </m.button>
        </div>
      </div>
    </m.div>
  );
}
