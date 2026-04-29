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
import { ArrowRight, Heart, ShoppingCart, Star, Zap, Shield } from "lucide-react";
import { m } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CurrencyFormat from "./CurrencyFormat";

const PLACEHOLDER_IMAGE = "/assets/images/placeholders/placeholder.png";

function ProductCardSkeleton() {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm">
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-3 space-y-2.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();
  const { currency, vndToUsdRate } = useSelector(
    (state: IRootState) => state.settings
  );

  const primaryImage =
    String(item?.subProducts?.[0]?.options?.[0]?.images?.[0] || "").trim() ||
    `/assets/images/placeholders/${item?.category?.slug || "placeholder"}.png`;
  const [imageSrc, setImageSrc] = useState(primaryImage);

  useEffect(() => {
    setImageSrc(primaryImage);
    setImageLoaded(false);
  }, [primaryImage]);

  if (loading || !item) {
    return <ProductCardSkeleton />;
  }

  const product = item.subProducts?.[0];
  const option = product?.options?.[0];
  const reviews = Array.isArray(item.reviews) ? item.reviews : [];
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0) / reviewCount
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
      ? Math.min(
          highestPriceWithDiscountRaw || highestPriceWithoutDiscount,
          highestPriceWithoutDiscount
        )
      : highestPriceWithDiscountRaw;
  const discountRate = Math.round(
    getDiscountRate(bestPriceWithoutDiscount, bestPriceWithDiscount)
  );
  const hasDiscount = discountRate > 0;
  const hasPriceRange = bestPriceWithDiscount !== highestPriceWithDiscount;

  const stockLeft =
    item.subProducts?.reduce((total, subProduct) => {
      const subTotal =
        subProduct.options?.reduce(
          (sum, currentOption) => sum + Math.max(0, Number(currentOption.qty || 0)),
          0
        ) || 0;
      return total + subTotal;
    }, 0) || 0;
  const isLowStock = stockLeft > 0 && stockLeft <= 5;
  const isOutOfStock = stockLeft === 0;
  const categoryName = item.category?.name || "Sản phẩm số";

  const formatPrice = (value: number) => {
    const normalized = Number(value || 0);
    if (currency === "USD") {
      const usd = normalized / Number(vndToUsdRate || 25500);
      return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${normalized.toLocaleString("vi-VN")}đ`;
  };

  const handleBuyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isOutOfStock) router.push(`/products/${item.slug}`);
  };

  const soldCount = reviewCount * 7 + Math.floor((stockLeft || 10) * 1.3);

  return (
    <m.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group flex flex-col rounded-2xl bg-white overflow-hidden",
        "border border-slate-100 hover:border-primary-200",
        "shadow-sm hover:shadow-lg hover:shadow-slate-200/80",
        "transition-all duration-300 hover:-translate-y-0.5"
      )}
    >
      {/* Image */}
      <Link href={`/products/${item.slug}`} className="relative block overflow-hidden bg-slate-50">
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={imageSrc}
            alt={item.name}
            width={400}
            height={400}
            className={cn(
              "h-full w-full object-cover transition-all duration-500 group-hover:scale-105",
              !imageLoaded && "opacity-0",
              imageLoaded && "opacity-100"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              if (imageSrc !== PLACEHOLDER_IMAGE) setImageSrc(PLACEHOLDER_IMAGE);
              setImageLoaded(true);
            }}
          />
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="inline-flex items-center rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              -{discountRate}%
            </span>
          )}
          {isLowStock && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              <Zap className="h-2.5 w-2.5" />
              Sắp hết
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setIsWishlisted(v => !v); }}
          className={cn(
            "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200",
            isWishlisted ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
          )}
          aria-label="Yêu thích"
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
        </button>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
            <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
              Hết hàng
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        {/* Category + Rating */}
        <div className="mb-1.5 flex items-center justify-between gap-1">
          <span className="line-clamp-1 text-[10px] font-medium text-slate-400">
            {categoryName}
          </span>
          {avgRating > 0 ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-500">{avgRating.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-300 shrink-0">Mới</span>
          )}
        </div>

        {/* Name */}
        <Link href={`/products/${item.slug}`}>
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 hover:text-primary-600 transition-colors min-h-[36px]">
            {item.name}
          </h3>
        </Link>

        {/* Sold count */}
        <p className="mt-1 text-[10px] text-slate-400">
          {soldCount > 0 ? `${soldCount.toLocaleString("vi-VN")} đã bán` : ""}
        </p>

        {/* Price */}
        <div className="mt-2">
          {hasPriceRange ? (
            <div>
              <span className="text-sm font-black text-primary-600 leading-none">
                {formatPrice(bestPriceWithDiscount)}
              </span>
              <span className="text-xs text-slate-400 ml-1">-</span>
              <span className="text-sm font-black text-primary-600 ml-1">
                {formatPrice(highestPriceWithDiscount)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black text-primary-600 leading-none">
                <CurrencyFormat value={bestPriceWithDiscount} />
              </span>
              {hasDiscount && (
                <span className="text-[11px] text-slate-400 line-through">
                  <CurrencyFormat value={bestPriceWithoutDiscount} />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Buy Button */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleBuyClick}
            disabled={isOutOfStock}
            className={cn(
              "flex w-full h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all duration-200",
              isOutOfStock
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-sm shadow-primary-200"
            )}
          >
            {isOutOfStock ? (
              "Hết hàng"
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                Mua ngay
              </>
            )}
          </button>
        </div>
      </div>
    </m.article>
  );
}
