"use client";
export const runtime = 'edge';
import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Search, Plus, Minus, Wallet, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CurrencyFormat from "@/components/modules/custom/CurrencyFormat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface WalletData {
  id: number;
  userId: number;
  balance: number;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export default function AdminWalletPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<"add" | "deduct">("add");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      const res = await fetch(`/api/admin/wallet?${params}`);
      const json = await res.json();
      if (json.success) {
        setWallets(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotal(json.pagination?.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const openDialog = (wallet: WalletData, type: "add" | "deduct") => {
    setSelectedWallet(wallet);
    setActionType(type);
    setAmount("");
    setReason("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedWallet || !amount) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedWallet.userId,
          amount: parseFloat(amount),
          action: actionType,
          reason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDialogOpen(false);
        fetchWallets();
      } else {
        toast.error(json.message || "Có lỗi xảy ra");
      }
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi xảy ra");
    } finally {
      setProcessing(false);
    }
  };

  const filteredWallets = wallets.filter((w) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.user?.name?.toLowerCase().includes(s) ||
      w.user?.email?.toLowerCase().includes(s) ||
      String(w.userId).includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 flex-1 min-w-[200px] max-w-md">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchWallets} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
        <p className="text-sm text-slate-500 ml-auto">Tổng: {total}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Người dùng</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-right font-semibold">Số dư</th>
                <th className="px-4 py-3 text-left font-semibold">Cập nhật</th>
                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Không có dữ liệu ví
                  </td>
                </tr>
              ) : (
                filteredWallets.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">#{w.userId}</td>
                    <td className="px-4 py-3 font-medium">{w.user?.name || "Không có"}</td>
                    <td className="px-4 py-3 text-slate-500">{w.user?.email || "Không có"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-emerald-600">
                        <CurrencyFormat value={w.balance} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(w.updatedAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => openDialog(w, "add")}
                        >
                          <Plus className="h-3 w-3 mr-1" />Cộng tiền
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => openDialog(w, "deduct")}
                        >
                          <Minus className="h-3 w-3 mr-1" />Trừ tiền
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Trang {page}/{totalPages}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {actionType === "add" ? "Cộng tiền vào ví" : "Trừ tiền từ ví"}
            </DialogTitle>
          </DialogHeader>
          {selectedWallet && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p className="font-medium">{selectedWallet.user?.name || "Không có"}</p>
                <p className="text-slate-500">{selectedWallet.user?.email || "Không có"}</p>
                <p className="text-emerald-600 font-semibold mt-1">
                  Số dư hiện tại: <CurrencyFormat value={selectedWallet.balance} />
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Số tiền (VND)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Ghi chú (tùy chọn)</label>
                <Input
                  placeholder="Lý do..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              {amount && (
                <div className={`text-sm font-medium ${actionType === "add" ? "text-emerald-600" : "text-red-600"}`}>
                  Số dư mới: <CurrencyFormat value={actionType === "add"
                    ? selectedWallet.balance + parseFloat(amount || "0")
                    : selectedWallet.balance - parseFloat(amount || "0")
                  } />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!amount || processing}
              className={actionType === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processing ? "Đang xử lý..." : actionType === "add" ? "Cộng tiền" : "Trừ tiền"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
