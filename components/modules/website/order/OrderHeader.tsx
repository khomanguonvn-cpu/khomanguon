"use client";
import { Order } from "@/types";
import { CheckCircle2, X, AlertCircle, Clock, Package, RefreshCw } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function getFulfillmentOverview(order: Order | undefined) {
  if (!order?.products || order.products.length === 0) {
    return null;
  }

  const total = order.products.length;
  let fulfilled = 0;
  let pending = 0;
  let refunded = 0;

  for (const product of order.products) {
    const extra = product as Record<string, unknown>;
    const status = String(extra.fulfillmentStatus || "pending").toLowerCase();
    if (status === "fulfilled") fulfilled++;
    else if (status === "auto_refunded") refunded++;
    else pending++;
  }

  return { total, fulfilled, pending, refunded };
}

export default function OrderHeader({ order }: { order: Order | undefined }) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const fulfillment = getFulfillmentOverview(order);
  const isWallet = order?.paymentMethod === "wallet";
  const isPaid = Boolean(order?.isPaid || isWallet);

  const isFullyFulfilled = fulfillment && fulfillment.fulfilled === fulfillment.total && fulfillment.pending === 0;
  const isAllPending = fulfillment && fulfillment.pending === fulfillment.total;
  const isAllRefunded = fulfillment && fulfillment.refunded === fulfillment.total && fulfillment.pending === 0;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 sm:px-5 md:px-6 py-4 sm:py-5 shadow-sm overflow-hidden">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        {/* Order code + date */}
        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            {t(language, "orderCode")}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-xl sm:text-2xl font-bold text-indigo-600 font-mono">
              #{order?._id}
            </p>
          </div>
          {order?.createdAt && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(order.createdAt).toLocaleString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Payment status badge */}
        <div className="flex items-center gap-2">
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              <span className="hidden sm:inline">{isWallet ? t(language, "orderPaymentByWallet") : t(language, "orderPaymentDone")}</span>
              <span className="sm:hidden">{t(language, "orderPaymentDone")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-red-700 shadow-sm">
              <X className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              <span>{t(language, "orderUnpaid")}</span>
            </span>
          )}
        </div>
      </div>

      {/* Fulfillment progress section - only show for paid orders */}
      {fulfillment && isPaid && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-50/50 border border-slate-200 p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center",
                isFullyFulfilled ? "bg-emerald-100" :
                isAllRefunded ? "bg-red-100" :
                isAllPending ? "bg-amber-100" : "bg-slate-100"
              )}>
                {isFullyFulfilled ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                ) : isAllRefunded ? (
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                ) : isAllPending ? (
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                ) : (
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {t(language, "orderFulfillmentStatus")}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                  {isFullyFulfilled ? (
                    <span className="text-emerald-600 font-medium">{t(language, "orderAllFulfilled")}</span>
                  ) : isAllRefunded ? (
                    <span className="text-red-600 font-medium">{t(language, "orderAllRefunded")}</span>
                  ) : isAllPending ? (
                    <span className="text-amber-600 font-medium">{t(language, "orderPendingFulfillmentStatus")}</span>
                  ) : (
                    <span className="text-slate-600">{t(language, "orderFulfillmentInProgress")}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {fulfillment.fulfilled}/{fulfillment.total}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400">{t(language, "orderProductsCountUnit")}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 sm:h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
            {fulfillment.fulfilled > 0 && (
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${(fulfillment.fulfilled / fulfillment.total) * 100}%` }}
              />
            )}
            {fulfillment.pending > 0 && (
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${(fulfillment.pending / fulfillment.total) * 100}%` }}
              />
            )}
            {fulfillment.refunded > 0 && (
              <div
                className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                style={{ width: `${(fulfillment.refunded / fulfillment.total) * 100}%` }}
              />
            )}
          </div>

          {/* Legend */}
          <div className="mt-2.5 flex flex-wrap gap-3 sm:gap-4 text-[11px] sm:text-xs">
            {fulfillment.fulfilled > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
                <strong>{fulfillment.fulfilled}</strong> {t(language, "orderFulfilledUnit")}
              </span>
            )}
            {fulfillment.pending > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block flex-shrink-0" />
                <strong>{fulfillment.pending}</strong> {t(language, "orderPendingUnit")}
              </span>
            )}
            {fulfillment.refunded > 0 && (
              <span className="flex items-center gap-1.5 text-red-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block flex-shrink-0" />
                <strong>{fulfillment.refunded}</strong> {t(language, "orderRefundedUnit")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Unpaid notice */}
      {fulfillment && !isPaid && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 sm:p-4 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-semibold text-amber-800">
              {t(language, "orderPayToReceiveHandover")}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {t(language, "orderWillProcessAfterPayment")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
