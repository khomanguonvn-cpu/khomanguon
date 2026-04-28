"use client";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, Store, TrendingUp, ArrowRight } from "lucide-react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function SellerHighlight() {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <aside>
      <div
        className="w-full border border-primary-200 bg-gradient-to-b from-primary-50 via-white to-slate-50 p-5 relative overflow-hidden"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        {/* Accent corner */}
        <div className="absolute top-0 right-0 w-14 h-14 bg-gradient-to-bl from-primary-600/20 to-transparent" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-primary-600 text-white clip-angular-sm">
          <Store className="h-3.5 w-3.5" />
          {t(language, "sellerBadge")}
        </div>

        <h3 className="mt-4 text-xl font-black leading-tight text-gray-900">
          {t(language, "sellerHighlightTitle")}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {t(language, "sellerDescription")}
        </p>

        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 clip-angular-sm flex-shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-medium">{t(language, "sellerP1")}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 clip-angular-sm flex-shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-medium">{t(language, "sellerP2")}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 clip-angular-sm flex-shrink-0">
              <BadgeCheck className="h-4 w-4" />
            </div>
            <span className="font-medium">{t(language, "sellerP3")}</span>
          </div>
        </div>

        <Link
          href="/account/seller/products"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/20 clip-angular"
        >
          {t(language, "sellerCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
