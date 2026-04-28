"use client";
import React, { useState } from "react";
import StripePayment from "./StripePayment";
import { Order } from "@/types";
import CurrencyFormat from "../../custom/CurrencyFormat";
import {
  CheckCircle2,
  Wallet,
  CreditCard,
  Truck,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { LanguageCode } from "@/store/settingsSlice";

function getPaymentMethodDisplay(method?: string, language?: LanguageCode) {
  const lang = language ?? "vi";
  const m = String(method || "").toLowerCase();
  if (m === "wallet") return { label: t(lang, "orderWalletBalance"), icon: Wallet };
  if (m === "payos" || m === "credit_card" || m === "stripe" || m === "bank_transfer") {
    return { label: t(lang, "orderPayOnline"), icon: CreditCard };
  }
  if (m === "cash_on_delivery" || m === "cod") return { label: t(lang, "orderCOD"), icon: Truck };
  return { label: method || "—", icon: CreditCard };
}

export default function OrderSummary({ order }: { order: Order | undefined }) {
  const [loading, setLoading] = useState(false);
  const { language } = useSelector((state: IRootState) => state.settings);

  const payment = getPaymentMethodDisplay(order?.paymentMethod, language);
  const PaymentIcon = payment.icon;
  const isWalletPayment = order?.paymentMethod === "wallet";
  const isPaid = Boolean(order?.isPaid || isWalletPayment);

  const discountPercent = order?.couponApplied?.discount || 0;
  const discountAmount =
    discountPercent > 0 && order?.totalBeforeDiscount
      ? (discountPercent * order.totalBeforeDiscount) / 100
      : 0;

  return (
    <div className="space-y-4 flex flex-col gap-4 lg:flex lg:flex-row lg:gap-4">
      {/* Order summary card */}
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-indigo-500" />
          {t(language, "checkoutOrderSummary")}
        </h3>

        <div className="space-y-2.5 sm:space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">{t(language, "checkoutSubtotal")}</span>
            <span className="text-slate-700">
              <CurrencyFormat value={order?.totalBeforeDiscount || 0} />
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span className="flex items-center gap-1.5">
                {t(language, "checkoutDiscount")}
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                  {discountPercent}%
                </span>
              </span>
              <span className="font-medium">-{CurrencyFormat({ value: discountAmount })}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-500">{t(language, "checkoutShippingFee")}</span>
            <span className="text-slate-700">
              {order?.shippingPrice === 0 ? (
                <span className="text-emerald-600 font-medium">{t(language, "checkoutShippingFree")}</span>
              ) : (
                <CurrencyFormat value={order?.shippingPrice || 0} />
              )}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-2.5 sm:pt-3 flex justify-between items-center">
            <span className="font-semibold text-slate-900 text-sm sm:text-base">{t(language, "checkoutTotal")}</span>
            <span className="font-bold text-lg sm:text-xl text-indigo-600">
              <CurrencyFormat value={order?.total || 0} />
            </span>
          </div>
        </div>
      </div>

      {/* Payment card */}
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-4 flex items-center gap-2">
          <PaymentIcon className="h-4 w-4 text-indigo-500" />
          {t(language, "orderCheckout")}
        </h3>

        <div className="space-y-3">
          {/* Payment method */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <PaymentIcon className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">{payment.label}</span>
            </div>
          </div>

          {/* Payment status indicator */}
          {isPaid ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">{t(language, "orderAlreadyPaid")}</p>
                <p className="text-xs text-emerald-600 opacity-70">
                  {isWalletPayment
                    ? t(language, "orderWalletDeducted")
                    : `${t(language, "orderPaidAt")} ${
                        order?.createdAt
                          ? new Date(order.createdAt).toLocaleString("vi-VN", {
                              timeZone: "Asia/Ho_Chi_Minh",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"
                      }`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Wallet className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-700">{t(language, "orderUnpaidLabel")}</p>
              </div>
            </div>
          )}

          {/* Stripe payment form for non-paid, non-wallet orders */}
          {!isPaid && order?.paymentMethod !== "wallet" && (
            <StripePayment order={order!} setLoading={setLoading} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}
