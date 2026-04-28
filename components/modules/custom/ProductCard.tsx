"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  getBestPriceWithDiscountFromProduct,
  getBestPriceWithoutDiscountFromProduct,
  getDiscountRate,
  getHighestPriceWithDiscountFromProduct,
  getHighestPriceWithoutDiscountFromProduct,
} from "@/lib/utils";
import { Product } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import CurrencyFormat from "./CurrencyFormat";
import { Star, ShoppingBag, Eye, Heart, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { m } from "framer-motion";

const getHighestPriceWithDiscount = getHighestPriceWithDiscountFromProduct;
const getHighestPriceWithoutDiscount = getHighestPriceWithoutDiscountFromProduct;

export default function ProductCard({
  item,
  loading,
}: {
  item: Product;
  loading: boolean;
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const { currency, vndToUsdRate } = useSelector(
    (state: IRootState) => state.settings
  );

  const active = 0;
  const product = item?.subProducts?.[active];
  const options = product?.options?.[active];

  const bestPriceWithDiscount = getBestPriceWithDiscountFromProduct(item);
  const bestPriceWithoutDiscount = getBestPriceWithoutDiscountFromProduct(item);
  const highestPriceWithDiscount = getHighestPriceWithDiscount(item);
  const highestPriceWithoutDiscount = getHighestPriceWithoutDiscount(item);
  const discountRate = getDiscountRate(bestPriceWithoutDiscount, bestPriceWithDiscount);
  const hasDiscount = discountRate > 0;
  const hasPriceRange = bestPriceWithDiscount !== highestPriceWithDiscount;

  const reviewCount = item.reviews?.length ?? 0;
  const avgRating =
    reviewCount > 0
      ? item.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  const stockLeft =
    item?.subProducts?.reduce((total, subProduct) => {
      const subTotal =
        subProduct.options?.reduce(
          (sum, option) => sum + Math.max(0, Number(option.qty || 0)),
          0
        ) || 0;
      return total + subTotal;
    }, 0) || 0;
  const isLowStock = stockLeft > 0 && stockLeft <= 5;
  const isOutOfStock = stockLeft === 0;

  const primaryImage =
    String(options?.images?.[0] || "").trim() ||
    `/assets/images/placeholders/${item.category?.slug || "placeholder"}.png`;
  const [imageSrc, setImageSrc] = useState(primaryImage);

  useEffect(() => {
    setImageSrc(primaryImage);
  }, [primaryImage]);

  const formatCardMoney = (value: number) => {
    const normalizedVnd = Number(value || 0);

    if (currency === "USD") {
      const usdValue = normalizedVnd / Number(vndToUsdRate || 25500);
      return `$${usdValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return normalizedVnd.toLocaleString("vi-VN");
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    router.push(`/products/${item.slug}`);
  };

  if (loading) {
    return (
      <div className="card card-lift p-0 overflow-hidden h-full">
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="p-5 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-7 w-36" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "card card-lift p-0 overflow-hidden flex flex-col h-full",
        "bg-white border border-slate-200 rounded-2xl shadow-card",
        isHovered && "shadow-card-hover"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/products/${item.slug}`}
        className="block relative overflow-hidden rounded-t-2xl"
      >
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
          <div className="flex flex-col gap-2">
            {hasDiscount && (
              <m.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="inline-flex items-center px-3 py-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold shadow-lg"
              >
                -{discountRate}%
              </m.span>
            )}
            {isLowStock && (
              <m.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-white text-xs font-bold shadow"
              >
                <Zap className="h-3 w-3" />
                Sắp hết
              </m.span>
            )}
          </div>

          <m.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
            className={cn(
              "p-2.5 rounded-full transition-all duration-300 z-10",
              "bg-white/90 backdrop-blur-sm shadow-lg",
              isWishlisted
                ? "text-red-500 scale-110"
                : "text-slate-400 hover:text-red-500 scale-100"
            )}
            aria-label="Thêm vào yêu thích"
          >
            <Heart
              className={cn("h-4 w-4 transition-all", isWishlisted && "fill-current scale-110")}
            />
          </m.button>
        </div>

        <div className="aspect-square w-full overflow-hidden bg-slate-50">
          <m.img
            src={imageSrc}
            alt={item.name}
            width={500}
            height={500}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              isHovered && "scale-110"
            )}
            onError={() => {
              if (imageSrc !== "/assets/images/placeholders/placeholder.png") {
                setImageSrc("/assets/images/placeholders/placeholder.png");
              }
            }}
          />
        </div>

        <m.div
          initial={false}
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 10,
          }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[5] pointer-events-none"
          style={{ pointerEvents: isHovered ? "auto" : "none" }}
        >
          <m.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold shadow-xl hover:bg-primary-600 hover:text-white transition-all duration-200 transform hover:scale-105"
            aria-label="Xem nhanh"
          >
            <Eye className="h-4 w-4" />
            <span>Xem nhanh</span>
          </m.button>
        </m.div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="px-4 py-2 rounded-xl bg-slate-900 text-white text-base font-bold">
              Hết hàng
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= Math.round(avgRating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-200 text-slate-200"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-slate-400">({reviewCount})</span>
        </div>

        <Link href={`/products/${item.slug}`} className="block flex-1">
          <h3 className="text-base lg:text-lg font-bold text-slate-800 line-clamp-2 hover:text-primary-600 transition-colors duration-200 leading-snug">
            {item.name}
          </h3>
        </Link>

        {isLowStock && (
          <p className="text-sm text-orange-500 font-semibold mt-2 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Chỉ còn {stockLeft} sản phẩm
          </p>
        )}

        <div className="mt-4 flex flex-col gap-1.5">
          {hasPriceRange ? (
            <>
              <div className="min-w-0">
                <span
                  className="block whitespace-nowrap text-[17px] font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 sm:text-lg"
                  title={
                    currency === "USD"
                      ? `${formatCardMoney(bestPriceWithDiscount)} - ${formatCardMoney(
                          highestPriceWithDiscount
                        )}`
                      : `${formatCardMoney(bestPriceWithDiscount)} - ${formatCardMoney(
                          highestPriceWithDiscount
                        )} ₫`
                  }
                >
                  {currency === "USD"
                    ? `${formatCardMoney(bestPriceWithDiscount)} - ${formatCardMoney(
                        highestPriceWithDiscount
                      )}`
                    : `${formatCardMoney(bestPriceWithDiscount)} - ${formatCardMoney(
                        highestPriceWithDiscount
                      )} ₫`}
                </span>
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-400 line-through">
                    <CurrencyFormat value={bestPriceWithoutDiscount} />
                  </span>
                  <span className="text-sm text-slate-400">-</span>
                  <span className="text-sm text-slate-400 line-through">
                    <CurrencyFormat value={highestPriceWithoutDiscount} />
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold">
                    -{discountRate}%
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
                <CurrencyFormat value={bestPriceWithDiscount} />
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-slate-400 line-through">
                    <CurrencyFormat value={bestPriceWithoutDiscount} />
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold">
                    -{discountRate}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <m.button
          onClick={handleBuyClick}
          disabled={isOutOfStock}
          whileHover={!isOutOfStock ? { scale: 1.01 } : {}}
          whileTap={{ scale: stockLeft === 0 ? 1 : 0.97 }}
          className={cn(
            "mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all duration-300",
            isOutOfStock
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-primary-500/20"
          )}
          aria-label={isOutOfStock ? "Hết hàng" : `Mua hàng ${item.name}`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{isOutOfStock ? "Hết hàng" : "Mua hàng"}</span>
          {!isOutOfStock && <ArrowRight className="h-4 w-4" />}
        </m.button>
      </div>
    </div>
  );
}
