"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  cn,
  getBestPriceWithDiscountFromProduct,
  getBestPriceWithoutDiscountFromProduct,
  getDiscountRate,
  getHighestPriceWithDiscountFromProduct,
  getHighestPriceWithoutDiscountFromProduct,
} from "@/lib/utils";
import { IRootState } from "@/store";
import { Product } from "@/types";
import { Star, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const PLACEHOLDER_IMAGE = "/assets/images/placeholders/placeholder.png";

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white border border-slate-100">
      <Skeleton className="w-full aspect-square" />
      <div className="p-2 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex items-center gap-1 pt-0.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export default function ProductCard({
  item,
  loading,
}: {
  item: Product | null;
  loading: boolean;
}) {
  const { currency, vndToUsdRate } = useSelector(
    (state: IRootState) => state.settings
  );

  const primaryImage =
    String(item?.subProducts?.[0]?.options?.[0]?.images?.[0] || "").trim() ||
    `/assets/images/placeholders/${item?.category?.slug || "placeholder"}.png`;
  const [imageSrc, setImageSrc] = useState(primaryImage);

  useEffect(() => {
    setImageSrc(primaryImage);
  }, [primaryImage]);

  if (loading || !item) {
    return <ProductCardSkeleton />;
  }

  const reviews = Array.isArray(item.reviews) ? item.reviews : [];
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + Number(r?.rating || 0), 0) / reviewCount
      : 0;

  const bestPriceWithDiscountRaw = getBestPriceWithDiscountFromProduct(item);
  const bestPriceWithoutDiscount = getBestPriceWithoutDiscountFromProduct(item);
  const highestPriceWithDiscountRaw = getHighestPriceWithDiscountFromProduct(item);
  const highestPriceWithoutDiscount = getHighestPriceWithoutDiscountFromProduct(item);

  const bestPriceWithDiscount =
    bestPriceWithoutDiscount > 0
      ? Math.min(bestPriceWithDiscountRaw || bestPriceWithoutDiscount, bestPriceWithoutDiscount)
      : bestPriceWithDiscountRaw;
  const highestPriceWithDiscount =
    highestPriceWithoutDiscount > 0
      ? Math.min(highestPriceWithDiscountRaw || highestPriceWithoutDiscount, highestPriceWithoutDiscount)
      : highestPriceWithDiscountRaw;

  const discountRate = Math.round(getDiscountRate(bestPriceWithoutDiscount, bestPriceWithDiscount));
  const hasDiscount = discountRate > 0;
  const hasPriceRange = bestPriceWithDiscount !== highestPriceWithDiscount;

  const stockLeft =
    item.subProducts?.reduce((total, sp) => {
      return total + (sp.options?.reduce((s, o) => s + Math.max(0, Number(o.qty || 0)), 0) || 0);
    }, 0) || 0;
  const isOutOfStock = stockLeft === 0;
  const isLowStock = stockLeft > 0 && stockLeft <= 5;

  // Simulate sold count from reviews
  const soldCount = reviewCount * 9 + Math.floor(stockLeft * 1.5) + 10;
  const soldLabel = soldCount >= 1000
    ? `${(soldCount / 1000).toFixed(1)}K`
    : soldCount.toString();

  const formatPrice = (value: number) => {
    const v = Number(value || 0);
    if (currency === "USD") {
      const usd = v / Number(vndToUsdRate || 25500);
      return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return `${v.toLocaleString("vi-VN")}đ`;
  };

  return (
    <Link
      href={`/products/${item.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl bg-white",
        "border border-slate-100 hover:border-rose-200",
        "shadow-sm hover:shadow-md transition-all duration-200",
        isOutOfStock && "opacity-70"
      )}
    >
      {/* Image Area */}
      <div className="relative overflow-hidden bg-slate-50 aspect-video">
        <img
          src={imageSrc}
          alt={item.name}
          loading="eager"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => {
            if (imageSrc !== PLACEHOLDER_IMAGE) setImageSrc(PLACEHOLDER_IMAGE);
          }}
        />

        {/* Discount badge top-left */}
        {hasDiscount && (
          <div className="absolute left-0 top-2 bg-rose-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-r-md leading-tight">
            -{discountRate}%
          </div>
        )}

        {/* Low stock badge */}
        {isLowStock && (
          <div className="absolute left-0 top-7 sm:top-8 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-r-md flex items-center gap-0.5 leading-tight">
            <Zap className="h-2.5 w-2.5" />
            Sắp hết
          </div>
        )}

        {/* Free shipping badge */}
        <div className="absolute bottom-1.5 left-1.5">
          <span className="inline-flex items-center gap-0.5 bg-teal-500/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-tight">
            <ShieldCheck className="h-2.5 w-2.5" />
            Bảo đảm
          </span>
        </div>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="bg-slate-800/80 text-white text-xs font-bold px-3 py-1 rounded-full">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-2 sm:p-2.5 gap-1">
        {/* Product name */}
        <p className="text-[13px] sm:text-[15px] leading-snug text-slate-800 line-clamp-2 font-medium group-hover:text-rose-600 transition-colors">
          {item.name}
        </p>

        {/* Rating + Sold */}
        <div className="flex items-center gap-1.5">
          {avgRating > 0 ? (
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] text-slate-500">{avgRating.toFixed(1)}</span>
            </div>
          ) : null}
          {avgRating > 0 && <span className="text-slate-300 text-[10px]">|</span>}
          <span className="text-[11px] text-slate-400">{soldLabel} đã bán</span>
        </div>

        {/* Price block */}
        <div className="mt-auto">
          {hasDiscount && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] sm:text-xs font-bold text-rose-600 leading-none">
                -{discountRate}%
              </span>
              <span className="text-base sm:text-lg font-black text-rose-600 leading-tight">
                {hasPriceRange
                  ? `${formatPrice(bestPriceWithDiscount)} - ${formatPrice(highestPriceWithDiscount)}`
                  : formatPrice(bestPriceWithDiscount)}
              </span>
            </div>
          )}

          {!hasDiscount && (
            <span className="text-base sm:text-lg font-black text-rose-600 leading-tight block">
              {hasPriceRange
                ? `${formatPrice(bestPriceWithDiscount)} - ${formatPrice(highestPriceWithDiscount)}`
                : formatPrice(bestPriceWithDiscount)}
            </span>
          )}

          {hasDiscount && bestPriceWithoutDiscount > 0 && (
            <span className="text-[10px] sm:text-xs text-slate-400 line-through leading-none">
              {formatPrice(bestPriceWithoutDiscount)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
