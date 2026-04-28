import { discountPrice, getDiscountRate } from "@/lib/utils";
import { Option } from "@/types";
import React from "react";
import { Coins, Tag, Flame } from "lucide-react";
import CurrencyFormat from "../../custom/CurrencyFormat";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ProductPrice({ option }: { option: Option }) {
  const hasDiscount = option.discount > 0;
  const salePrice = hasDiscount
    ? discountPrice(option.price, option.discount)
    : option.price;
  const originalPrice = option.price;
  const discountRate = getDiscountRate(originalPrice, salePrice);
  const savings = originalPrice - salePrice;

  return (
    <m.div
      className="flex flex-col gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Price Display - prominent card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-primary-50/50 to-indigo-50 border border-primary-100 p-5">
        {/* Decorative accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary-200/30 to-transparent rounded-bl-[3rem]" />

        <div className="flex items-center gap-3 flex-wrap relative z-10">
          {/* Sale Price */}
          <m.span
            className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 tracking-tight"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.15 }}
          >
            <CurrencyFormat value={salePrice} />
          </m.span>

          {/* Original Price */}
          {hasDiscount && (
            <>
              <span className="text-lg text-slate-400 line-through font-medium">
                <CurrencyFormat value={originalPrice} />
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold shadow-lg shadow-red-500/20 animate-pulse">
                -{discountRate}%
              </span>
            </>
          )}
        </div>

        {/* Savings */}
        {hasDiscount && savings > 0 && (
          <m.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="inline-flex items-center gap-2 mt-2 px-3.5 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-bold relative z-10"
          >
            <Flame className="h-4 w-4 text-green-500 animate-pulse" />
            <span>Tiết kiệm <CurrencyFormat value={savings} /></span>
          </m.div>
        )}
      </div>

      {/* VAT notice */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Tag className="h-3 w-3" />
          <span>Đã bao gồm VAT. Không phí ẩn.</span>
        </div>
      </div>
    </m.div>
  );
}
