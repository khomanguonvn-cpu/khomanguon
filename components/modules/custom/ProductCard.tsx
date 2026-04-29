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
import { ArrowRight, Eye, Heart, ShoppingBag, Star, Zap } from "lucide-react";
import { m } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import CurrencyFormat from "./CurrencyFormat";

const PLACEHOLDER_IMAGE = "/assets/images/placeholders/placeholder.png";

function ProductCardSkeleton() {
  return (
    <div className="h-full overflow-hidden border border-slate-200 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
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
  const [isHovered, setIsHovered] = useState(false);
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
      ? reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0) /
        reviewCount
      : 0;

  const bestPriceWithDiscountRaw = getBestPriceWithDiscountFromProduct(item);
  const bestPriceWithoutDiscount = getBestPriceWithoutDiscountFromProduct(item);
  const highestPriceWithDiscountRaw = getHighestPriceWithDiscountFromProduct(item);
  const highestPriceWithoutDiscount =
    getHighestPriceWithoutDiscountFromProduct(item);
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
  const optionLabel = option?.option || product?.style?.name || "Có sẵn";

  const formatCompactMoney = (value: number) => {
    const normalizedVnd = Number(value || 0);

    if (currency === "USD") {
      const usdValue = normalizedVnd / Number(vndToUsdRate || 25500);
      return `$${usdValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return `${normalizedVnd.toLocaleString("vi-VN")} ₫`;
  };

  const handleBuyClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isOutOfStock) return;
    router.push(`/products/${item.slug}`);
  };

  return (
    <m.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={cn(
        "group flex h-full flex-col overflow-hidden border bg-white shadow-sm transition-all duration-300",
        "border-slate-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden bg-slate-100">
        <Link href={`/products/${item.slug}`} className="block">
          <div className="aspect-[4/3] w-full overflow-hidden bg-white">
            <m.img
              src={imageSrc}
              alt={item.name}
              width={520}
              height={390}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500",
                isHovered && "scale-105"
              )}
              onError={() => {
                if (imageSrc !== PLACEHOLDER_IMAGE) {
                  setImageSrc(PLACEHOLDER_IMAGE);
                }
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/0 to-slate-950/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="pointer-events-none absolute bottom-3 left-3 flex translate-y-2 items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-900 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Eye className="h-3.5 w-3.5" />
            Xem chi tiết
          </div>
        </Link>

        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
          {hasDiscount && (
            <span className="inline-flex w-fit items-center rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              -{discountRate}%
            </span>
          )}
          {isLowStock && (
            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              <Zap className="h-3 w-3" />
              Sắp hết
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsWishlisted((value) => !value)}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm backdrop-blur transition-all duration-200 hover:text-rose-500",
            isWishlisted && "text-rose-500"
          )}
          aria-label="Thêm vào yêu thích"
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
        </button>

        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/45">
            <span className="rounded-md bg-white px-4 py-2 text-sm font-black uppercase tracking-wider text-slate-900 shadow-lg">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="line-clamp-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {categoryName}
          </span>
          <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{avgRating > 0 ? avgRating.toFixed(1) : "Mới"}</span>
          </div>
        </div>

        <Link href={`/products/${item.slug}`} className="block">
          <h3 className="line-clamp-2 min-h-[44px] text-[15px] font-bold leading-snug text-slate-900 transition-colors hover:text-primary-600">
            {item.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="line-clamp-1">{optionLabel}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{reviewCount} đánh giá</span>
        </div>

        <div className="mt-4 space-y-1.5">
          {hasPriceRange ? (
            <>
              <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
                <span
                  className="text-lg font-black leading-tight text-primary-700"
                  title={`${formatCompactMoney(bestPriceWithDiscount)} - ${formatCompactMoney(
                    highestPriceWithDiscount
                  )}`}
                >
                  {formatCompactMoney(bestPriceWithDiscount)}
                </span>
                <span className="text-sm font-bold text-slate-400">-</span>
                <span className="text-lg font-black leading-tight text-primary-700">
                  {formatCompactMoney(highestPriceWithDiscount)}
                </span>
              </div>
              {hasDiscount && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="line-through">
                    <CurrencyFormat value={bestPriceWithoutDiscount} />
                  </span>
                  <span>-</span>
                  <span className="line-through">
                    <CurrencyFormat value={highestPriceWithoutDiscount} />
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-black leading-tight text-primary-700">
                <CurrencyFormat value={bestPriceWithDiscount} />
              </span>
              {hasDiscount && (
                <span className="text-sm font-medium text-slate-400 line-through">
                  <CurrencyFormat value={bestPriceWithoutDiscount} />
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={handleBuyClick}
            disabled={isOutOfStock}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all duration-200",
              isOutOfStock
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-slate-950 text-white hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-600/20"
            )}
            aria-label={isOutOfStock ? "Hết hàng" : `Mua ${item.name}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{isOutOfStock ? "Hết hàng" : "Mua ngay"}</span>
            {!isOutOfStock && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </m.article>
  );
}
