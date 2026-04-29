"use client";
import { Order, ProductOrder } from "@/types";
import { LanguageCode } from "@/store/settingsSlice";
import Image from "next/image";
import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  Download,
  XCircle,
  AlertCircle,
  Smartphone,
  Copy,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Package,
  RefreshCw,
} from "lucide-react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import CurrencyFormat from "../../custom/CurrencyFormat";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import ContactSeller from "../chat/ContactSeller";

function getFulfillmentBadge(status?: string, language: LanguageCode = "vi") {
  const s = String(status || "pending").toLowerCase();
  if (s === "fulfilled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        {t(language, "orderFulfilled")}
      </span>
    );
  }
  if (s === "auto_refunded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        <XCircle className="h-3 w-3" />
        {t(language, "orderRefunded")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      <Clock className="h-3 w-3" />
      {t(language, "orderPendingFulfillment")}
    </span>
  );
}

function getImageSrc(images: ProductOrder["images"]): string {
  if (!images) return "/assets/images/placeholders/placeholder.png";
  if (typeof images === "string") return images;
  if (Array.isArray(images)) return images[0] || "/assets/images/placeholders/placeholder.png";
  return "/assets/images/placeholders/placeholder.png";
}

function getStyleColor(style: ProductOrder["style"]): string {
  if (!style) return "#111827";
  return style.color || "#111827";
}

function getTimeRemaining(autoRefundAt: string | null | undefined, language: LanguageCode) {
  if (!autoRefundAt) return null;
  const deadline = new Date(autoRefundAt).getTime();
  const now = Date.now();
  const diff = deadline - now;
  if (diff <= 0) return t(language, "orderOverdue");

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return t(language, "orderHoursMinutes").replace("{{hours}}", String(hours)).replace("{{minutes}}", String(minutes));
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label ? t(language, "orderCopied").replace("{{label}}", label) : t(language, "orderCopiedSimple"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t(language, "orderCopyFailed"));
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors text-xs font-medium"
      title={t(language, "orderCopy")}
    >
      <Copy className="h-3 w-3" />
      {copied ? t(language, "orderCopiedShort") : t(language, "orderCopyShort")}
    </button>
  );
}

function AccountCard({ account, index }: { account: Record<string, string>; index: number }) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const [visible, setVisible] = useState(index === 0);

  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
      <button
        onClick={() => setVisible(!visible)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
            {index + 1}
          </span>
          <span className="font-semibold text-emerald-800 text-sm">{account.accountType || t(language, "orderAccountType")}</span>
        </div>
        <div className="flex items-center gap-2">
          {visible && (
            <span className="text-xs text-emerald-600 font-medium">{t(language, "orderDisplaying")}</span>
          )}
          {visible ? (
            <EyeOff className="h-4 w-4 text-emerald-600" />
          ) : (
            <Eye className="h-4 w-4 text-emerald-400" />
          )}
        </div>
      </button>

      {visible && (
        <div className="px-4 pb-4 space-y-2">
          <div className="h-px bg-emerald-200" />
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
              <div>
                <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wide">{t(language, "orderUsername")}</p>
                <p className="font-mono text-sm text-emerald-800 font-semibold break-all">{account.username}</p>
              </div>
              <CopyButton text={account.username} label="username" />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
              <div>
                <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wide">{t(language, "orderPasswordLabel")}</p>
                <p className="font-mono text-sm text-emerald-800 font-semibold break-all">{account.password}</p>
              </div>
              <CopyButton text={account.password} label="password" />
            </div>
            {account.note && (
              <div className="rounded-lg bg-amber-50/80 px-3 py-2">
                <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">{t(language, "orderNote")}</p>
                <p className="text-sm text-amber-700 italic">{account.note}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SourceCodeCard({ download, index }: { download: Record<string, string>; index: number }) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const [visible, setVisible] = useState(index === 0);

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden">
      <button
        onClick={() => setVisible(!visible)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {index + 1}
          </span>
          <span className="font-semibold text-blue-800 text-sm">{download.label || t(language, "orderFileDownload")}</span>
        </div>
        {visible ? (
          <EyeOff className="h-4 w-4 text-blue-600" />
        ) : (
          <Eye className="h-4 w-4 text-blue-400" />
        )}
      </button>

      {visible && (
        <div className="px-4 pb-4 space-y-2">
          <div className="h-px bg-blue-200" />
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">URL</p>
                <p className="text-xs text-blue-700 font-mono break-all leading-relaxed">{download.url}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={download.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 transition-colors"
              >
                <Download className="h-4 w-4" />
                {t(language, "orderDownload")}
              </a>
              <CopyButton text={download.url} label="URL" />
            </div>
            {download.passwordHint && (
              <div className="rounded-lg bg-amber-50/80 px-3 py-2">
                <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">{t(language, "orderPasswordIfAny")}</p>
                <p className="text-sm text-amber-700 font-semibold">{download.passwordHint}</p>
              </div>
            )}
            {download.note && (
              <div className="rounded-lg bg-slate-50/80 px-3 py-2">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{t(language, "orderNote")}</p>
                <p className="text-sm text-slate-600 italic">{download.note}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderProducts({ order }: { order: Order | undefined }) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const isPaid = Boolean(order?.isPaid || order?.paymentMethod === "wallet");

  return (
    <div className="w-full border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Section header */}
      <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-500" />
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{t(language, "orderProductsOrdered")}</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {order?.products.length} {t(language, "orderProductsCountUnit")}
        </span>
      </div>

      {order?.products.map((item: ProductOrder, idx: number) => {
        const extra = item as Record<string, unknown>;
        const fulfillmentStatus = String(extra.fulfillmentStatus || "pending").toLowerCase();
        const autoRefundAt = extra.autoRefundAt as string | null | undefined;
        const fulfilledAt = extra.fulfilledAt as string | null | undefined;
        const totalQty = Number(item.qty || 1);

        const deliveryAccess = item.deliveryAccess;
        const accounts = deliveryAccess?.method === "ai_account"
          ? deliveryAccess.accounts as Array<Record<string, string>>
          : [];
        const downloads = deliveryAccess?.method === "source_code"
          ? deliveryAccess.downloads as Array<Record<string, string>>
          : [];

        return (
          <div
            key={idx}
            className={cn(
              "p-4 sm:p-5 md:p-6",
              idx > 0 && "border-t border-slate-200",
              fulfillmentStatus === "fulfilled"
                ? "bg-gradient-to-r from-emerald-50/20 to-transparent"
                : fulfillmentStatus === "auto_refunded"
                ? "bg-gradient-to-r from-red-50/20 to-transparent"
                : "bg-white"
            )}
          >
            {/* Product header */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 w-full mb-4">
              {/* Product image */}
              <div className="img-box w-full sm:w-auto flex-shrink-0">
                <Image
                  alt={t(language, "orderProduct")}
                  src={getImageSrc(item.images)}
                  className="bg-cover h-24 w-full sm:w-28 sm:h-28 rounded-xl border border-slate-200 object-cover"
                  width={112}
                  height={112}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/images/placeholders/placeholder.png";
                  }}
                />
              </div>

              {/* Product info */}
              <div className="flex-1 w-full min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-sm sm:text-base leading-snug text-slate-900 line-clamp-2">
                      {item.name}
                    </h2>

                    {/* Variant & color */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600">
{item.option && (
                          <span>
                            <span className="text-slate-400">{t(language, "orderVariantLabel")}</span>{" "}
                            <span className="font-medium">{item.option}</span>
                          </span>
                        )}
                        {item.style?.color && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-slate-400">{t(language, "orderColorLabel")}</span>
                          <span
                            className="w-3.5 h-3.5 rounded border border-gray-300 inline-block"
                            style={{ background: getStyleColor(item.style) }}
                            title={getStyleColor(item.style)}
                          />
                        </span>
                      )}
                    </div>

                    {/* Attributes */}
                    {item.attributes && item.attributes.length > 0 && (
                      <div className="mt-1.5 text-xs sm:text-sm text-slate-600">
                        {item.attributes.map((attr, attrIdx) => (
                          <div key={`${attr.key}-${attrIdx}`}>
                            <span className="text-slate-400">{attr.key}:</span>{" "}
                            <span className="font-medium">{String(attr.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Qty + Price row */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-slate-400">{t(language, "orderQtyLabel")}</span>
                        <span className="font-bold text-slate-800">{totalQty}</span>
                      </span>
                      <span className="font-bold text-indigo-600 text-sm sm:text-base">
                        <CurrencyFormat value={item.price} />
                      </span>
<span className="text-slate-400 text-xs">
                          {t(language, "orderSubtotalLabel")} <strong className="text-slate-700"><CurrencyFormat value={item.price * totalQty} /></strong>
                        </span>
                    </div>
                  </div>

                  {/* Right side: status badge & chat */}
                  <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                    {getFulfillmentBadge(fulfillmentStatus, language)}
                    {isPaid && item.sellerId ? (
                      <ContactSeller
                        sellerId={item.sellerId}
                        productId={Number(item.sellerProductId) || 0}
                        productName={item.name}
                        className="h-8 text-xs px-3 py-1 bg-white"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Status content area */}
            <div className="space-y-3">
              {/* Not paid yet */}
              {!isPaid && order?.paymentMethod !== "wallet" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-500" />
                  <span>{t(language, "orderPayToReceive")}</span>
                </div>
              )}

              {/* Paid but pending fulfillment */}
              {isPaid && fulfillmentStatus === "pending" && (
                <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-4 py-4 text-sm text-amber-900 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold flex items-center gap-1.5 text-amber-800">
                        {t(language, "orderWaitingSeller")}
                      </p>
                      <p className="mt-1 text-amber-700/80 leading-relaxed">
                        {t(language, "orderSellerWillDeliver")}
                      </p>
                      {autoRefundAt && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-100/70 px-3 py-1.5 text-xs font-semibold text-amber-800">
                          <Smartphone className="h-3.5 w-3.5" />
                          {t(language, "orderDeadline")} {formatDate(autoRefundAt)}
                          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                            {getTimeRemaining(autoRefundAt, language)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fulfilled */}
              {isPaid && fulfillmentStatus === "fulfilled" && (
                <div className="space-y-3">
                  {/* Success banner */}
                  <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-emerald-800 text-sm">{t(language, "orderDeliveredSuccess")}</p>
                      {fulfilledAt && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {t(language, "orderDeliveredAt")} {formatDate(fulfilledAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AI Account credentials */}
                  {accounts.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-emerald-600" />
                        <h4 className="font-bold text-emerald-800 text-sm">
                          {t(language, "orderAccountInfo")} ({accounts.length} {t(language, "orderAccountType")})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {accounts.map((account, i) => (
                          <AccountCard key={i} account={account} index={i} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source code downloads */}
                  {downloads.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-blue-600" />
                        <h4 className="font-bold text-blue-800 text-sm">
                          {t(language, "orderSourceCodeLink")} ({downloads.length} {t(language, "orderFileDownload")})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {downloads.map((download, i) => (
                          <SourceCodeCard key={i} download={download} index={i} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generic success (no delivery data) */}
                  {accounts.length === 0 && downloads.length === 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      {t(language, "orderProcessedSuccess")}
                      {fulfilledAt && (
                        <span className="ml-1 text-emerald-600">{t(language, "orderAt")} {formatDate(fulfilledAt)}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Auto refunded */}
              {isPaid && fulfillmentStatus === "auto_refunded" && (
                <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white px-4 py-4 text-sm text-red-900 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-bold flex items-center gap-1.5 text-red-800">
                        {t(language, "orderAutoRefunded")}
                      </p>
                      <p className="mt-1 text-red-700/80 leading-relaxed">
                        {t(language, "orderSellerNoResponse")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
