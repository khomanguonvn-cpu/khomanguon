"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BadgePercent, Users, TrendingUp, Wallet, CheckCircle2,
  Clock, Settings, Loader2, ToggleLeft, ToggleRight, Save,
  ChevronDown, ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import Toast from "@/components/modules/custom/Toast";
import { cn } from "@/lib/utils";

type AdminAffiliateData = {
  config: { commissionRate: number; durationDays: number; enabled: boolean };
  stats: { totalReferrals: number; pendingCount: number; pendingAmount: number; paidCount: number; paidAmount: number };
  topReferrers: { referrerId: number; name: string; email: string; totalCommission: number; count: number }[];
  recentCommissions: {
    id: number; referrerId: number; refereeId: number; referrerName: string; refereeName: string;
    referrerEmail: string; depositAmount: number; commissionAmount: number; commissionRate: number;
    status: string; createdAt: string; paidAt: string | null;
  }[];
};

function formatCurrency(v: number) {
  return Number(v || 0).toLocaleString("vi-VN") + "đ";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function AdminAffiliatePage() {
  const [data, setData] = useState<AdminAffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [config, setConfig] = useState({ commissionRate: 1, durationDays: 365, enabled: true });

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/admin/affiliate");
      setData(res.data.data);
      setConfig(res.data.data.config);
    } catch {
      toast.custom(<Toast message="Không thể tải dữ liệu affiliate" status="error" />);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await axios.put("/api/admin/affiliate", {
        action: "update_config",
        commissionRate: config.commissionRate,
        durationDays: config.durationDays,
        enabled: config.enabled,
      });
      toast.custom(<Toast message="Đã lưu cấu hình!" status="success" />);
      fetchData();
    } catch {
      toast.custom(<Toast message="Lỗi khi lưu cấu hình" status="error" />);
    } finally {
      setSaving(false);
    }
  };

  const handlePayCommissions = async () => {
    if (selectedIds.length === 0) {
      toast.custom(<Toast message="Chọn ít nhất 1 hoa hồng để thanh toán" status="error" />);
      return;
    }
    setPaying(true);
    try {
      await axios.put("/api/admin/affiliate", { action: "pay_commissions", commissionIds: selectedIds });
      toast.custom(<Toast message={`Đã thanh toán ${selectedIds.length} hoa hồng!`} status="success" />);
      setSelectedIds([]);
      fetchData();
    } catch {
      toast.custom(<Toast message="Lỗi khi thanh toán hoa hồng" status="error" />);
    } finally {
      setPaying(false);
    }
  };

  const pendingCommissions = data?.recentCommissions.filter(c => c.status === "pending") || [];
  const allPendingIds = pendingCommissions.map(c => c.id);
  const allSelected = allPendingIds.length > 0 && allPendingIds.every(id => selectedIds.includes(id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(allPendingIds);
  };

  const toggleId = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="text-slate-500">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <BadgePercent className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Quản lý Affiliate</h1>
          <p className="text-sm text-slate-500">Cấu hình hoa hồng và duyệt thanh toán cho referrer</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Tổng referral", value: data?.stats.totalReferrals || 0, icon: Users, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "Chờ duyệt", value: data?.stats.pendingCount || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Tổng chờ (VND)", value: formatCurrency(data?.stats.pendingAmount || 0), icon: Wallet, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Đã thanh toán", value: data?.stats.paidCount || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Tổng đã trả (VND)", value: formatCurrency(data?.stats.paidAmount || 0), icon: TrendingUp, color: "text-emerald-700", bg: "bg-emerald-50" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl p-4 border border-white/60", s.bg)}>
            <s.icon className={cn("h-5 w-5 mb-2", s.color)} />
            <p className={cn("text-lg font-black", s.color)}>{typeof s.value === "number" ? s.value : s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Config Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-600" />
          <h2 className="text-base font-bold text-slate-900">Cấu hình hệ thống Affiliate</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Tỷ lệ hoa hồng (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={config.commissionRate}
              onChange={e => setConfig(c => ({ ...c, commissionRate: parseFloat(e.target.value) || 0 }))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
            <p className="text-[11px] text-slate-400">Mặc định: 1% trên mỗi lần nạp</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Thời hạn hoa hồng (ngày)</label>
            <input
              type="number"
              min={1}
              step={1}
              value={config.durationDays}
              onChange={e => setConfig(c => ({ ...c, durationDays: parseInt(e.target.value) || 365 }))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
            <p className="text-[11px] text-slate-400">Mặc định: 365 ngày kể từ khi đăng ký</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Trạng thái hệ thống</label>
            <button
              onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
              className={cn(
                "flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-semibold transition-all w-full",
                config.enabled
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              )}
            >
              {config.enabled
                ? <><ToggleRight className="h-5 w-5" /> Đang bật</>
                : <><ToggleLeft className="h-5 w-5" /> Đang tắt</>}
            </button>
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu cấu hình
        </button>
      </div>

      {/* Pending Commissions */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Hoa hồng chờ thanh toán</h2>
            <p className="text-xs text-slate-400 mt-0.5">{pendingCommissions.length} giao dịch</p>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handlePayCommissions}
              disabled={paying}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all"
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Thanh toán {selectedIds.length} mục
            </button>
          )}
        </div>

        {pendingCommissions.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">Không có hoa hồng chờ duyệt</div>
        ) : (
          <>
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Chọn tất cả</span>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingCommissions.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleId(c.id)}
                    className="h-4 w-4 rounded shrink-0"
                  />
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        <span className="text-slate-400 text-xs">Người giới thiệu: </span>{c.referrerName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{c.referrerEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">{c.refereeName}</span> nạp {formatCurrency(c.depositAmount)}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDate(c.createdAt)}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="text-sm font-black text-emerald-600">+{formatCurrency(c.commissionAmount)}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Chờ duyệt</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Top Referrers */}
      {(data?.topReferrers.length || 0) > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Top Referrer</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {data?.topReferrers.map((r, i) => (
              <div key={r.referrerId} className="flex items-center gap-4 px-5 py-3">
                <span className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                  i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-white" : i === 2 ? "bg-orange-400 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.email} • {r.count} lần hoa hồng</p>
                </div>
                <span className="text-sm font-black text-emerald-600">{formatCurrency(r.totalCommission)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
