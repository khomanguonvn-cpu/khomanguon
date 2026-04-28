"use client";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function SellerHighlight() {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <aside>
      <div className="w-full rounded-md border border-primary-200 bg-gradient-to-b from-emerald-50 to-white p-4 sm:p-5 shadow-md">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
          <Store className="h-3.5 w-3.5" />
          {t(language, "sellerBadge")}
        </div>

        <h3 className="mt-4 text-2xl font-extrabold leading-tight text-gray-900">
          {t(language, "sellerHighlightTitle")}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {t(language, "sellerDescription")}
        </p>

        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary-700" />
            <span>{t(language, "sellerP1")}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-700" />
            <span>{t(language, "sellerP2")}</span>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-primary-700" />
            <span>{t(language, "sellerP3")}</span>
          </div>
        </div>

        <Link
          href="/account/seller/products"
          className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
        >
          {t(language, "sellerCta")}
        </Link>
      </div>
    </aside>
  );
}
