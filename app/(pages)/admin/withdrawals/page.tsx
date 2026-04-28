export const runtime = 'edge';

"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, RefreshCw, XCircle, DollarSign, Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WithdrawItem = {
  id: number;
  userId: number;
  transactionId: number;
  amountRequested: number;
  feeAmount: number;
  amountNet: number;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  status: "pending" | "approved" | "rejected";
  rejectReason: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
};

type FeeConfig = {
  key: string;
  value: number;
  description: string;
  updatedAt: string | null;
};

const statusOptions = [
  { label: "Tất cả", value: "" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Đã từ chối", value: "rejected" },
];

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<WithdrawItem[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null);
  const [feeInput, setFeeInput] = useState("");
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeLoading, setFeeLoading] = useState(true);

  const fetchFeeConfig = useCallback(async () => {
    setFeeLoading(true);
    try {
      const res = await fetch("/api/admin/withdrawal-fee");
      const json = await res.json();
      if (json?.success && json?.data) {
        setFeeConfig(json.data);
        setFeeInput(String(json.data.value));
      }
    } catch {
      // ignore
    } finally {
      setFeeLoading(false);
    }
  }, []);

  const saveFeeConfig = async () => {
    const value = parseFloat(feeInput);
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error("Phần trăm phí phải nằm trong khoảng 0 - 100");
      return;
    }
    setFeeSaving(true);
    try {
      const res = await fetch("/api/admin/withdrawal-fee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feePercent: value }),
      });
      const json = await res.json();
      if (json?.success) {
        setFeeConfig((prev) => prev ? { ...prev, value, updatedAt: new Date().toISOString() } : prev);
        toast.success("Đã lưu cấu hình phí rút tiền");
      } else {
        toast.error(json?.message || "Không thể lưu cấu hình");
      }
    } catch {
      toast.error("Không thể lưu cấu hình");
    } finally {
      setFeeSaving(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/wallet-withdrawals?${params}`);
      const json = await res.json();
      if (json?.success) {
        setItems(json.data || []);
        setTotalPages(Number(json.pagination?.totalPages || 1));
      }
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchFeeConfig();
  }, [fetchFeeConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: number) => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/wallet-withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });

      if (res.ok) {
        toast.success("Duyệt rút tiền thành công");
        await fetchData();
      } else {
        const json = await res.json();
        toast.error(json.message || "Duyệt thất bại");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const rejectReason = window.prompt("Nhập lý do từ chối yêu cầu rút tiền:", "Sai thông tin ngân hàng");
    if (rejectReason === null) return;

    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/wallet-withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reject", rejectReason }),
      });

      if (res.ok) {
        toast.success("Đã từ chối yêu cầu rút tiền");
        await fetchData();
      } else {
        const json = await res.json();
        toast.error(json.message || "Từ chối thất bại");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fee Rate Config Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Cấu hình phí rút tiền</h2>
            <p className="text-xs text-white/70 mt-0.5">Thiết lập tỷ lệ % phí rút tiền cho seller</p>
          </div>
        </div>
        <div className="p-6">
          {feeLoading ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-32 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-10 w-32 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  Tỷ lệ phí rút tiền (% trên số tiền rút)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0 - 100"
                      value={feeInput}
                      onChange={(e) => setFeeInput(e.target.value)}
                      className="h-12 text-lg font-bold pr-16 rounded-xl border-2 border-slate-200 focus:border-primary-500 bg-slate-50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">%</span>
                  </div>
                  <Button
                    onClick={saveFeeConfig}
                    disabled={feeSaving || feeInput === String(feeConfig?.value ?? "")}
                    className="h-12 px-6 rounded-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-lg shadow-primary-500/20"
                  >
                    {feeSaving ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Cập nhật lần cuối: {feeConfig?.updatedAt
                    ? new Date(feeConfig.updatedAt).toLocaleString("vi-VN")
                    : "Chưa có"}
                  {" • "}
                  Phí mặc định: 1%
                </p>
              </div>
              <div className="flex flex-col items-end justify-end min-w-[200px]">
                <p className="text-xs text-slate-400 mb-1">Phí hiện tại</p>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
                  {feeConfig?.value ?? 1}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Duyệt rút tiền thủ công</h2>
            <p className="text-sm text-slate-500">
              Quản lý toàn bộ yêu cầu rút tiền từ người dùng và xử lý thủ công.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button variant="outline" type="button" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tải lại
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Người dùng</th>
                <th className="px-4 py-3 text-left">Số tiền rút</th>
                <th className="px-4 py-3 text-left">Thực nhận</th>
                <th className="px-4 py-3 text-left">Ngân hàng</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày tạo</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Không có yêu cầu rút tiền nào
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono">#{item.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.userName || `Người dùng #${item.userId}`}</p>
                      <p className="text-xs text-slate-500">{item.userEmail || "-"}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(item.amountRequested)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-emerald-600">{formatMoney(item.amountNet)}</p>
                      <p className="text-xs text-slate-500">Phí: {formatMoney(item.feeAmount)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.bankName}</p>
                      <p className="text-xs text-slate-500">{item.bankAccount}</p>
                      <p className="text-xs text-slate-500">{item.accountHolder}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          item.status === "pending" && "bg-amber-100 text-amber-700",
                          item.status === "approved" && "bg-emerald-100 text-emerald-700",
                          item.status === "rejected" && "bg-slate-200 text-slate-700"
                        )}
                      >
                        {item.status === "pending"
                          ? "Chờ duyệt"
                          : item.status === "approved"
                            ? "Đã duyệt"
                            : "Đã từ chối"}
                      </Badge>
                      {item.rejectReason && (
                        <p className="mt-1 text-xs text-rose-600 max-w-48 truncate" title={item.rejectReason}>
                          {item.rejectReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === "pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700"
                            disabled={actionLoadingId === item.id}
                            onClick={() => handleApprove(item.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Duyệt
                          </Button>
                          <Button
                            type="button"
                            className="h-8 bg-rose-600 hover:bg-rose-700"
                            disabled={actionLoadingId === item.id}
                            onClick={() => handleReject(item.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Từ chối
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-slate-400">Đã xử lý</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Trang {page}/{totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
