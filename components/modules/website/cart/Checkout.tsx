import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState } from "react";
import CurrencyFormat from "../../custom/CurrencyFormat";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { Tag, Truck, Receipt, CreditCard, ShieldCheck, Package } from "lucide-react";
import { m } from "framer-motion";

export default function Checkout({
  subtotal,
  shippingFee,
  total,
  tax,
  className,
  addToCartHandler,
  loading,
  order = true,
}: {
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  className: string;
  addToCartHandler: () => void;
  loading: boolean;
  order?: boolean;
}) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const [coupon, setCoupon] = useState("");

  const rows = [
    {
      icon: Receipt,
      label: t(language, "checkoutSubtotal"),
      value: subtotal,
    },
    {
      icon: Truck,
      label: t(language, "checkoutShippingFee"),
      value: shippingFee,
      note: shippingFee === 0 ? t(language, "checkoutShippingFree") : "",
    },
    {
      icon: Receipt,
      label: t(language, "checkoutTax"),
      value: tax,
      note: tax === 0 ? t(language, "checkoutNoTax") : "",
    },
  ];

  return (
    <m.div
      className={cn(
        "flex flex-col gap-4 sm:gap-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6 shadow-sm overflow-hidden",
        className
      )}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-slate-100">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-md shadow-primary-500/20">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900">
            {t(language, "checkoutOrderSummary")}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Package className="h-3 w-3" />
            {t(language, "checkoutDigitalProductNote")}
          </p>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {rows.map((row, i) => (
          <m.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="flex justify-between items-center"
          >
            <div className="flex items-center gap-2 text-slate-600">
              <row.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
              <span className="text-xs sm:text-sm font-medium">{row.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {row.note && (
                <span className="text-[10px] sm:text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-lg whitespace-nowrap">
                  {row.note}
                </span>
              )}
              <span className="font-semibold text-slate-700 text-xs sm:text-sm">
                <CurrencyFormat value={row.value} />
              </span>
            </div>
          </m.div>
        ))}

        {/* Divider */}
        <div className="border-t border-dashed border-slate-200 pt-2.5 sm:pt-3 mt-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900">
                {t(language, "checkoutTotal")}
              </span>
            </div>
            <m.span
              key={total}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600"
            >
              <CurrencyFormat value={total} />
            </m.span>
          </div>
        </div>
      </div>

      {/* Coupon Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
          <Input
            type="text"
            name="coupon"
            placeholder={t(language, "checkoutCouponPlaceholder")}
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="pl-9 sm:pl-10 border-slate-200 focus:border-primary-500 rounded-xl bg-slate-50 text-xs sm:text-sm py-2 sm:py-2.5"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="px-3 sm:px-5 rounded-xl border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-300 font-bold text-xs sm:text-sm"
        >
          {t(language, "checkoutApply")}
        </Button>
      </div>

      {/* Place Order Button */}
      <m.button
        onClick={addToCartHandler}
        disabled={loading}
        whileTap={!loading ? { scale: 0.97 } : {}}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold transition-all duration-200 shadow-lg",
          "bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-primary-500/20",
          loading && "opacity-60 cursor-wait"
        )}
      >
        {loading ? (
          <m.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="tracking-wide">
              {t(language, "checkoutPlaceOrder")}
            </span>
          </m.div>
        )}
      </m.button>

      {/* Trust note */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-400">
        <ShieldCheck className="h-3 w-3" />
        <span>{t(language, "checkoutSecurePayment")}</span>
      </div>

      {/* Continue Shopping */}
      {!order && (
        <Link
          href="/products"
          className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 text-center text-xs sm:text-sm"
        >
          {t(language, "checkoutContinueShopping")}
        </Link>
      )}
    </m.div>
  );
}
