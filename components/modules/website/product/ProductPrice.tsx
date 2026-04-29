"use client";

import { discountPrice, getDiscountRate } from "@/lib/utils";
import { Option } from "@/types";
import React from "react";
import { Flame, ShieldCheck, Tag } from "lucide-react";
import { m } from "framer-motion";
import CurrencyFormat from "../../custom/CurrencyFormat";

export default function ProductPrice({ option }: { option?: Option }) {
  const price = Number(option?.price || 0);
  const discount = Number(option?.discount || 0);
  const rawSalePrice = discount > 0 && price > 0 ? discountPrice(price, discount) : price;
  const salePrice = rawSalePrice > 0 && rawSalePrice < price ? rawSalePrice : price;
  const hasDiscount = salePrice < price;
  const discountRate = Math.round(getDiscountRate(price, salePrice));
  const savings = Math.max(0, price - salePrice);

  if (!option) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-500">Đang cập nhật giá</p>
      </div>
    );
  }

  return (
    <m.div
      className="rounded-lg border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-emerald-50 p-4 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-700">
            <Tag className="h-3.5 w-3.5" />
            Giá bán
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <m.span
              className="text-3xl font-black leading-none text-primary-700 sm:text-4xl"
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, delay: 0.12 }}
            >
              <CurrencyFormat value={salePrice} />
            </m.span>

            {hasDiscount && (
              <span className="text-base font-semibold text-slate-400 line-through">
                <CurrencyFormat value={price} />
              </span>
            )}
          </div>
        </div>

        {hasDiscount && (
          <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-black text-white shadow-sm">
            <Flame className="h-4 w-4" />
            Giảm {discountRate}%
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
        {hasDiscount && savings > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
            Tiết kiệm <CurrencyFormat value={savings} />
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          Đã bao gồm VAT, không phí ẩn
        </span>
      </div>
    </m.div>
  );
}
