"use client";
import { Button } from "@/components/ui/button";
import { ShoppingBasket } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function EmptyCart() {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4">
      <div className="flex flex-col items-center gap-6 sm:gap-8 max-w-xs w-full">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 flex items-center justify-center">
          <ShoppingBasket className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
        </div>

        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-2">
            {t(language, "cartEmpty")}
          </h1>
          <p className="text-sm text-slate-400">
            {t(language, "cartEmptyBrowseDesc")}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:gap-3">
          <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl font-semibold">
            <Link href="/signin" className="text-base">
              {t(language, "emptyCartLogin")}
            </Link>
          </Button>

          <Button size="lg" className="w-full sm:w-auto rounded-xl font-semibold bg-primary-600 hover:bg-primary-700">
            <Link href="/products" className="text-base">
              {t(language, "emptyCartShop")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

