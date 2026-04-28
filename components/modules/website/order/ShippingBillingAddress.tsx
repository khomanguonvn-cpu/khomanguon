"use client";
import { Mail, User, MapPin, CheckCircle2, Clock, Package } from "lucide-react";
import Image from "next/image";
import React from "react";
import { Order } from "@/types";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { LanguageCode } from "@/store/settingsSlice";

function getPaymentMethodLabel(method?: string, language?: LanguageCode) {
  const lang = language ?? "vi";
  switch (method) {
    case "wallet":
      return t(lang, "orderPaymentByWallet");
    case "payos":
      return t(lang, "orderPayOnline");
    case "cash_on_delivery":
      return t(lang, "orderCOD");
    default:
      return method || "—";
  }
}

export default function ShippingBillingAddress({
  order,
}: {
  order: Order | undefined;
}) {
  const { language } = useSelector((state: IRootState) => state.settings);

  if (!order) {
    return null;
  }

  const userImage = order.user?.image || "";
  const userName = order.user?.name || "—";
  const userEmail = order.user?.email || "—";
  const deliveryInfo =
    (order as Record<string, unknown>).deliveryInfo as string | undefined ||
    order.shippingAddress?.address ||
    "—";
  const isPaid = Boolean(order.isPaid || order.paymentMethod === "wallet");

  return (
    <div className="w-full flex flex-col gap-4 lg:flex lg:items-start lg:gap-4">
      {/* User + Payment card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <User className="h-5 w-5 text-indigo-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          {/* Payment method */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400">{t(language, "orderPaymentMethodLabel")}</p>
              <p className="text-xs sm:text-sm font-medium text-slate-700 truncate">
                {getPaymentMethodLabel(order.paymentMethod, language)}
              </p>
            </div>
          </div>

          {/* Payment status */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isPaid ? "bg-emerald-50" : "bg-amber-50"
              }`}
            >
              {isPaid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Clock className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div>
              <p className="text-[11px] text-slate-400">{t(language, "orderStatusLabel")}</p>
              <p className="text-xs sm:text-sm font-semibold">
                {isPaid ? (
                  <span className="text-emerald-600">{t(language, "orderPaymentDone")}</span>
                ) : (
                  <span className="text-amber-600">{t(language, "orderUnpaid")}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery info card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-4 w-4 text-purple-500" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">
            {t(language, "orderHandoverInfo")}
          </h3>
        </div>

        <div className="space-y-3">
          {/* Email/delivery channel */}
          <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
            <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 mb-0.5">{t(language, "orderHandoverEmail")}</p>
              <span className="text-xs sm:text-sm text-slate-700 break-all font-mono">
                {userEmail || "—"}
              </span>
            </div>
          </div>

          {/* Delivery info from order */}
          {deliveryInfo && deliveryInfo !== "—" ? (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-blue-500 mb-0.5 font-medium">{t(language, "orderHandoverChannel")}</p>
              <p className="text-xs sm:text-sm text-blue-800 break-all leading-relaxed">{deliveryInfo}</p>
            </div>
          ) : null}

          {/* Shipping address fallback */}
          {order.shippingAddress?.address && order.shippingAddress.address !== deliveryInfo ? (
            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-slate-400 mb-0.5">{t(language, "orderShippingAddress")}</p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {[
                  order.shippingAddress.address,
                  order.shippingAddress.city,
                  order.shippingAddress.state,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Help text */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          {t(language, "orderNeedHelp")}{" "}
          <span className="text-indigo-600 font-medium">{t(language, "orderContactPage")}</span>.
        </p>
      </div>
    </div>
  );
}
