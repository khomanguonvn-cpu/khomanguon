"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  Package,
  RefreshCw,
  Send,
  XCircle,
  AlertCircle,
  Smartphone,
  Code2,
  ChevronsUpDown,
} from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

type OrderItem = {
  id: number;
  orderId: number;
  productName: string;
  variantLabel: string;
  qty: number;
  price: number;
  productType: string;
  fulfillmentStatus: string;
  fulfilledAt: string | null;
  autoRefundAt: string | null;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function formatDate(iso: string | null) {
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
    return iso;
  }
}

function getTimeRemaining(autoRefundAt: string | null) {
  if (!autoRefundAt) return null;
  const deadline = new Date(autoRefundAt).getTime();
  const now = Date.now();
  const diff = deadline - now;
  if (diff <= 0) return "Đã quá hạn";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}p`;
  return `${minutes}p`;
}

const STATUS_STEPS = [
  { key: "pending", label: "Chờ trả", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  { key: "fulfilled", label: "Đã trả", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  { key: "auto_refunded", label: "Hoàn tiền", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
];

const TABS = [
  { value: "pending", label: "Chờ trả đơn", icon: Clock },
  { value: "fulfilled", label: "Đã trả", icon: CheckCircle2 },
  { value: "auto_refunded", label: "Đã hoàn tiền", icon: XCircle },
  { value: "", label: "Tất cả", icon: Package },
];

function getProductTypeIcon(type: string) {
  switch (type) {
    case "ai_account":
      return { Icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50" };
    case "source_code":
      return { Icon: Code2, color: "text-purple-600", bg: "bg-purple-50" };
    default:
      return { Icon: Package, color: "text-slate-600", bg: "bg-slate-50" };
  }
}

export default function SellerOrdersManager() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [pendingCount, setPendingCount] = useState(0);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [fulfillingItem, setFulfillingItem] = useState<OrderItem | null>(null);
  const [fulfillUsername, setFulfillUsername] = useState("");
  const [fulfillPassword, setFulfillPassword] = useState("");
  const [fulfillTwoFA, setFulfillTwoFA] = useState("");
  const [fulfillUrl, setFulfillUrl] = useState("");
  const [fulfillQty, setFulfillQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await axios.get("/api/seller/orders", {
          params: { status: statusFilter, page, limit: 20 },
        });
        setItems(res.data?.data || []);
        setPendingCount(res.data?.pendingCount || 0);
        setPagination(
          res.data?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
          }
        );
      } catch {
        toast.error("Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    void loadItems(1);
  }, [loadItems]);

  const openFulfill = (item: OrderItem) => {
    setFulfillingItem(item);
    setFulfillUsername("");
    setFulfillPassword("");
    setFulfillTwoFA("");
    setFulfillUrl("");
    setFulfillQty(1);
  };

  const closeFulfill = () => {
    setFulfillingItem(null);
  };

  const handleFulfill = async () => {
    if (!fulfillingItem) return;

    const qtyToFulfill = fulfillQty > fulfillingItem.qty ? fulfillingItem.qty : fulfillQty;
    const payload: Record<string, unknown> = {
      orderItemId: fulfillingItem.id,
      qty: qtyToFulfill,
    };

    if (fulfillingItem.productType === "ai_account") {
      if (!fulfillUsername.trim() || !fulfillPassword.trim()) {
        toast.error("Vui lòng nhập đầy đủ username và password");
        return;
      }
      payload.username = fulfillUsername.trim();
      payload.password = fulfillPassword.trim();
      if (fulfillTwoFA.trim()) {
        payload.twoFactorCode = fulfillTwoFA.trim();
      }
    } else if (fulfillingItem.productType === "source_code") {
      if (!fulfillUrl.trim()) {
        toast.error("Vui lòng nhập URL bàn giao");
        return;
      }
      payload.url = fulfillUrl.trim();
    }

    setSubmitting(true);
    try {
      await axios.post("/api/seller/orders", payload);
      const payoutAmount = fulfillingItem.price * qtyToFulfill;
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="font-semibold">Trả đơn thành công!</p>
            <p className="text-sm opacity-80">
              +{formatCurrency(payoutAmount)} đã được chuyển vào ví của bạn
            </p>
          </div>
        </div>
      );
      closeFulfill();
      await loadItems(pagination.page);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không thể trả đơn";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgressSteps = (status: string) => {
    const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);

    return (
      <div className="flex items-center justify-between w-full">
        {STATUS_STEPS.map((step, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs ${
                    isPast || isCurrent ? step.dot : "bg-gray-200"
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : isCurrent ? (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                  ) : (
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  )}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-medium mt-1 ${isCurrent ? step.color : isPast ? step.color : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                    isPast ? step.dot : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 sm:p-7 lg:p-8 text-white shadow-xl shadow-slate-900/5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-lg backdrop-blur-md sm:h-14 sm:w-14">
              <Package className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
                Quản lý đơn hàng
              </h1>
              <p className="mt-1 text-sm text-white/80 sm:text-base">
                {pendingCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-0.5 text-xs font-bold text-amber-950">
                    <Clock className="h-3.5 w-3.5" />
                    {pendingCount} đơn đang chờ bạn trả
                  </span>
                ) : (
                  "Không có đơn nào đang chờ"
                )}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => loadItems(1)}
            disabled={loading}
            className="rounded-xl border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = statusFilter === tab.value;
            const count = tab.value === "pending" ? pendingCount : null;

            return (
              <button
                key={tab.value || "all"}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "inline-flex flex-1 min-w-fit items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap",
                  isActive
                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
                {count !== null && count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold min-w-[20px] text-center",
                      isActive ? "bg-white/25 text-white" : "bg-amber-500 text-white"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 sm:py-16">
          <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 p-10 text-center shadow-sm sm:p-16">
          <div className="relative mb-5">
            <div className="absolute inset-0 -m-3 rounded-full bg-indigo-100/60 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-md">
              <Package className="h-10 w-10 text-indigo-400" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-800 sm:text-xl">Không có đơn hàng nào</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {statusFilter
              ? `Hiện không có đơn ở trạng thái “${TABS.find((t) => t.value === statusFilter)?.label}”. Thử chuyển tab khác.`
              : "Danh sách đơn hàng đang trống. Khi có đơn mới, chúng sẽ hiện ở đây."}
          </p>
          {statusFilter !== "" && (
            <Button
              variant="outline"
              onClick={() => setStatusFilter("")}
              className="mt-5 rounded-xl"
            >
              <Package className="mr-2 h-4 w-4" />
              Xem tất cả đơn
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {items.map((item) => {
            const typeInfo = getProductTypeIcon(item.productType);
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border bg-white p-3 sm:p-4 md:p-5 shadow-sm transition-all",
                  item.fulfillmentStatus === "pending"
                    ? "border-amber-200"
                    : item.fulfillmentStatus === "fulfilled"
                    ? "border-emerald-200"
                    : "border-red-200"
                )}
              >
                {/* Top row */}
                <div className="flex flex-col gap-3">
                  {/* Header: product + type + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", typeInfo.bg)}>
                        <typeInfo.Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", typeInfo.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] sm:text-xs font-medium text-slate-400 whitespace-nowrap">
                            Đơn #{item.orderId}
                          </span>
                          <span className="text-slate-300 hidden sm:inline">·</span>
                          <span className="text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mt-0.5">
                          {item.productName}
                        </h3>
                        {item.variantLabel && (
                          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{item.variantLabel}</p>
                        )}
                      </div>
                    </div>

                    {/* Action + Status */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {item.fulfillmentStatus === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => openFulfill(item)}
                          className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
                        >
                          <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span>Trả đơn</span>
                        </Button>
                      )}

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold whitespace-nowrap",
                          item.fulfillmentStatus === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : item.fulfillmentStatus === "fulfilled"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {item.fulfillmentStatus === "pending" ? (
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        ) : item.fulfillmentStatus === "fulfilled" ? (
                          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        ) : (
                          <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        )}
                        {item.fulfillmentStatus === "pending"
                          ? "Chờ trả"
                          : item.fulfillmentStatus === "fulfilled"
                          ? "Đã trả"
                          : "Đã hoàn tiền"}
                      </span>
                    </div>
                  </div>

                  {/* Price info */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 px-1">
                    <span>
                      SL: <strong className="text-slate-800">{item.qty}</strong>
                    </span>
                    <span className="font-semibold text-indigo-600">
                      {formatCurrency(item.price)} / 1 cái
                    </span>
                    <span className="font-semibold text-indigo-700">
                      Tổng: {formatCurrency(item.price * item.qty)}
                    </span>
                  </div>

                  {/* Progress steps */}
                  <div className="px-1">{renderProgressSteps(item.fulfillmentStatus)}</div>

                  {/* Footer info */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs px-1 pt-0.5 border-t border-slate-100">
                    {item.fulfillmentStatus === "pending" && item.autoRefundAt && (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                        <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Còn {getTimeRemaining(item.autoRefundAt)} tự động hoàn
                      </span>
                    )}
                    {item.fulfillmentStatus === "pending" && (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Coins className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        +{formatCurrency(item.price * item.qty)} khi trả
                      </span>
                    )}
                    {item.fulfillmentStatus === "fulfilled" && item.fulfilledAt && (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Đã trả lúc {formatDate(item.fulfilledAt)}
                      </span>
                    )}
                    {item.fulfillmentStatus === "auto_refunded" && (
                      <span className="inline-flex items-center gap-1 text-red-500">
                        <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Hoàn tự động do quá hạn 24h
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-3 sm:pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => loadItems(pagination.page - 1)}
                className="rounded-xl text-xs sm:text-sm"
              >
                Trước
              </Button>
              <span className="flex items-center text-xs sm:text-sm text-slate-600 px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadItems(pagination.page + 1)}
                className="rounded-xl text-xs sm:text-sm"
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Fulfillment Modal */}
      {fulfillingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <m.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Modal handle bar (mobile only) */}
            <div className="h-1 bg-slate-200 rounded-full mx-auto mt-3 w-12 sm:hidden" />

            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                Trả đơn #{fulfillingItem.orderId}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">
                {fulfillingItem.productName}
                <span className="ml-2 text-indigo-600 font-semibold">
                  {formatCurrency(fulfillingItem.price * fulfillingItem.qty)}
                </span>
              </p>

              {/* Money preview */}
              <div className="mb-3 sm:mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-emerald-700">
                  Bạn nhận được{" "}
                  <strong className="font-bold">
                    {formatCurrency(fulfillingItem.price * (fulfillQty > fulfillingItem.qty ? fulfillingItem.qty : fulfillQty))}
                  </strong>{" "}
                  khi trả thành công
                </span>
              </div>

              {/* Quantity selector */}
              <div className="mb-3">
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Số lượng cần trả
                </label>
                <div className="relative inline-block w-full">
                  <select
                    value={fulfillQty}
                    onChange={(e) => setFulfillQty(Number(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 pr-8 sm:pr-10 text-sm text-slate-800 font-medium shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    {/* Generate options up to fulfillingItem.qty */}
                    {Array.from({ length: fulfillingItem.qty }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} cái
                      </option>
                    ))}
                    {/* Unlimited option - allows fulfillment beyond original qty */}
                    <option value={fulfillingItem.qty + 1}>
                      Không giới hạn ({fulfillingItem.qty} cái)
                    </option>
                  </select>
                  <ChevronsUpDown className="pointer-events-none absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Đơn hàng yêu cầu: <strong>{fulfillingItem.qty} cái</strong>
                </p>
              </div>

              {fulfillingItem.productType === "ai_account" ? (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-xl p-3 leading-relaxed">
                    Nhập thông tin tài khoản để bàn giao cho người mua.
                  </p>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Tên đăng nhập (Username) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="username@email.com"
                      value={fulfillUsername}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFulfillUsername(e.target.value)
                      }
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Mật khẩu (Password) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={fulfillPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFulfillPassword(e.target.value)
                      }
                      className="rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Mã 2FA (tùy chọn)
                    </label>
                    <Input
                      placeholder="Nhập mã 2FA nếu có"
                      value={fulfillTwoFA}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFulfillTwoFA(e.target.value)
                      }
                      className="rounded-xl text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-xl p-3 leading-relaxed">
                    Nhập URL bàn giao mã nguồn cho người mua (Google Drive, Mega, GitHub...).
                  </p>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      URL bàn giao <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="https://drive.google.com/..."
                      value={fulfillUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFulfillUrl(e.target.value)
                      }
                      className="rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 sm:mt-6 flex gap-2 justify-end">
                <Button variant="outline" onClick={closeFulfill} className="rounded-xl text-xs sm:text-sm">
                  Hủy
                </Button>
                <Button
                  onClick={handleFulfill}
                  disabled={submitting}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs sm:text-sm"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {submitting ? "Đang xử lý..." : "Xác nhận trả đơn"}
                </Button>
              </div>
            </div>
          </m.div>
        </div>
      )}
    </div>
  );
}
