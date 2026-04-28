import { getRating } from "@/lib/utils";
import { Product } from "@/types";
import React from "react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { ShieldCheck, Clock, Star, Award, BadgeCheck, Zap } from "lucide-react";
import { m } from "framer-motion";
import ContactSeller from "../chat/ContactSeller";

function AnimatedStars({ rating, reviewCount, language }: { rating: number; reviewCount: number; language: "vi" | "en" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <m.div
            key={star}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: star * 0.08, type: "spring", stiffness: 200 }}
          >
            <Star
              className={cn(
                "h-4 w-4",
                star <= Math.round(rating)
                  ? "fill-amber-400 text-amber-400"
                  : star - 0.5 <= rating
                  ? "fill-amber-400/50 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              )}
            />
          </m.div>
        ))}
      </div>
      <span className="text-sm font-semibold text-amber-500">{rating.toFixed(1)}</span>
      <span className="text-sm text-slate-400">|</span>
      <span className="text-sm text-slate-500">{reviewCount} {t(language, "reviewsCount")}</span>
    </div>
  );
}

import { cn } from "@/lib/utils";

export default function ProductInfo({ product }: { product: Product }) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const rating = getRating(product);

  const trustItems = [
    {
      icon: ShieldCheck,
      label: t(language, "productTrustSafe"),
      sub: t(language, "productTrustVerified"),
      bg: "bg-gradient-to-br from-emerald-50 to-green-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: Zap,
      label: t(language, "productTrustFastDelivery"),
      sub: t(language, "productTrustAfterPayment"),
      bg: "bg-gradient-to-br from-amber-50 to-orange-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      icon: BadgeCheck,
      label: t(language, "productTrustQuality"),
      sub: t(language, "productTrustConfirmed"),
      bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Award,
      label: t(language, "productTrustSupport247"),
      sub: t(language, "productTrustLiveChat"),
      bg: "bg-gradient-to-br from-purple-50 to-violet-50",
      border: "border-purple-200",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <m.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Product Name */}
      <div>
        <m.h1
          className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {product.name}
        </m.h1>
      </div>

      {/* Rating Row */}
      {rating > 0 && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatedStars rating={rating} reviewCount={product.reviews.length} language={language} />
        </m.div>
      )}

      {/* Description */}
      <m.p
        className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        {product.description}
      </m.p>

      {/* Trust Badges - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {trustItems.map((item, idx) => (
          <m.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.07 }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border",
              item.bg,
              item.border
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
              item.iconBg
            )}>
              <item.icon className={cn("h-5 w-5", item.iconColor)} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500 leading-tight">{item.sub}</p>
            </div>
          </m.div>
        ))}
      </div>

      {/* Contact Seller Button */}
      {product.sellerId && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
