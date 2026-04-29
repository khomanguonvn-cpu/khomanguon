"use client";

import { cn, getRating } from "@/lib/utils";
import { IRootState } from "@/store";
import { Product } from "@/types";
import { Award, BadgeCheck, Clock, ShieldCheck, Star, Zap } from "lucide-react";
import { m } from "framer-motion";
import React from "react";
import { useSelector } from "react-redux";
import ContactSeller from "../chat/ContactSeller";

function AnimatedStars({
  rating,
  reviewCount,
  language,
}: {
  rating: number;
  reviewCount: number;
  language: "vi" | "en";
}) {
  const reviewLabel = language === "vi" ? "đánh giá" : "reviews";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <m.div
            key={star}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: star * 0.06, type: "spring", stiffness: 220 }}
          >
            <Star
              className={cn(
                "h-4 w-4",
                star <= Math.round(rating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              )}
            />
          </m.div>
        ))}
      </div>
      <span className="text-sm font-black text-slate-900">{rating.toFixed(1)}</span>
      <span className="text-sm text-slate-300">|</span>
      <span className="text-sm font-medium text-slate-500">
        {reviewCount} {reviewLabel}
      </span>
    </div>
  );
}

export default function ProductInfo({ product }: { product: Product }) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];
  const rating = getRating({ ...product, reviews });
  const isVi = language === "vi";

  const trustItems = [
    {
      icon: ShieldCheck,
      label: isVi ? "Giao dịch an toàn" : "Secure transaction",
      sub: isVi ? "Sản phẩm được kiểm duyệt" : "Moderated product",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      icon: Zap,
      label: isVi ? "Bàn giao nhanh" : "Fast handover",
      sub: isVi ? "Nhận sau thanh toán" : "After payment",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      icon: BadgeCheck,
      label: isVi ? "Biến thể rõ ràng" : "Clear variants",
      sub: isVi ? "Giá và tồn kho minh bạch" : "Transparent price and stock",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      icon: Award,
      label: isVi ? "Hỗ trợ người mua" : "Buyer support",
      sub: isVi ? "Trao đổi trực tiếp" : "Direct conversation",
      className: "border-violet-200 bg-violet-50 text-violet-700",
    },
  ];

  return (
    <m.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {product?.category?.name && (
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
              {product.category.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <Clock className="h-3.5 w-3.5" />
            {isVi ? "Sẵn sàng giao" : "Ready to deliver"}
          </span>
        </div>

        <m.h1
          className="text-2xl font-black leading-tight tracking-tight text-slate-950 lg:text-4xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
        >
          {product.name}
        </m.h1>

        <AnimatedStars rating={rating} reviewCount={reviews.length} language={language} />
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {trustItems.map((item, index) => (
          <m.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className={cn("flex items-center gap-3 rounded-lg border p-3", item.className)}
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-white/70">
              <item.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black leading-tight">{item.label}</span>
              <span className="block text-xs font-medium leading-tight opacity-80">{item.sub}</span>
            </span>
          </m.div>
        ))}
      </div>

      {product.sellerId && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <ContactSeller
            sellerId={product.sellerId}
            sellerName={product.sellerName}
            productId={Number(product.sellerProductId) || 0}
            productName={product.name}
          />
        </m.div>
      )}
    </m.div>
  );
}
