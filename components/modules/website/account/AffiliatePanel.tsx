"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Copy, Check, Users, TrendingUp, Clock, Gift, ExternalLink,
  BadgePercent, CalendarDays, Loader2, ChevronRight, Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import Toast from "@/components/modules/custom/Toast";
import { cn } from "@/lib/utils";

type Commission = {
  id: number;
  refereeName: string;
  depositAmount: number;
  commissionAmount: number;
  status: "pending" | "paid" | "expired";
  createdAt: string;
  paidAt: string | null;
};

type AffiliateData = {
  enabled: boolean;
  referralCode: string;
  referralLink: string;
  commissionRate: number;
  durationDays: number;
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  totalPending: number;
  commissions: Commission[];
};

function formatCurrency(v: number) {
  return v.toLocaleString("vi-VN") + "đ";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AffiliatePanel() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    axios.get("/api/affiliate")
      .then(res => setData(res.data.data))
      .catch(() => toast.custom(<Toast message="Không thể tải dữ liệu affiliate" status="error" />))
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      toast.custom(<Toast message="Đã sao chép!" status="success" />);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="text-slate-500 text-sm">Đang tải...</span>
      </div>
    );
  }

  if (!data || !data.enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Gift className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm">Hệ thống affiliate chưa được kích hoạt.</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Tổng đã nhận",
      value: formatCurrency(data.totalEarned),
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      label: "Đang chờ duyệt",
      value: formatCurrency(data.totalPending),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Người được giới thiệu",
      value: data.totalReferrals.toString(),
      icon: Users,
      color: "text-primary-600",
      bg: "bg-primary-50",
      border: "border-primary-200",
    },
    {
      label: "Đang hoạt động",
      value: data.activeReferrals.toString(),
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-primary-600 to-indigo-700 p-5 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BadgePercent className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-semibold text-white/80">Chương trình Affiliate</span>
            </div>
            <h2 className="text-xl font-black">Kiếm {data.commissionRate}% hoa hồng</h2>
            <p className="text-sm text-white/75 mt-1">
              Mỗi lần người bạn giới thiệu nạp tiền trong <strong>{data.durationDays} ngày</strong>, bạn nhận ngay {data.commissionRate}%
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <CalendarDays className="h-4 w-4" />
            Hiệu lực {data.durationDays} ngày / người
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-3 sm:p-4", s.bg, s.border)}>
            <div className={cn("inline-flex p-2 rounded-xl mb-2", "bg-white/60")}>
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
            <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referral Link Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary-600" />
          <h3 className="text-base font-bold text-slate-900">Link giới thiệu của bạn</h3>
        </div>

        {/* Code */}
        <div>
          <label className="text-xs text-slate-500 font-medium mb-1.5 block">Mã giới thiệu</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <span className="font-mono text-lg font-black text-primary-600 tracking-widest">
                {data.referralCode}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(data.referralCode, "code")}
              className="shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors active:scale-95"
            >
              {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "code" ? "Đã chép" : "Sao chép"}
            </button>
          </div>
        </div>

        {/* Full link */}
        <div>
          <label className="text-xs text-slate-500 font-medium mb-1.5 block">Link đăng ký đầy đủ</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 overflow-hidden">
              <p className="text-xs text-slate-600 truncate font-mono">{data.referralLink}</p>
            </div>
            <button
              onClick={() => copyToClipboard(data.referralLink, "link")}
              className="shrink-0 flex items-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              {copied === "link" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-xl bg-gradient-to-r from-primary-50 to-violet-50 border border-primary-100 p-4">
          <p className="text-xs font-semibold text-primary-700 mb-3">📋 Cách thức hoạt động</p>
          <div className="space-y-2">
            {[
              "Chia sẻ link hoặc mã giới thiệu của bạn cho bạn bè",
              `Bạn bè đăng ký qua link → hệ thống ghi nhận trong ${data.durationDays} ngày`,
              `Mỗi lần họ nạp tiền vào ví, bạn nhận ${data.commissionRate}% hoa hồng`,
              "Admin duyệt và cộng tiền vào ví của bạn",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission History */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h3 className="text-base font-bold text-slate-900">Lịch sử hoa hồng</h3>
          </div>
          <span className="text-xs text-slate-400">{data.commissions.length} giao dịch</span>
        </div>

        {data.commissions.length === 0 ? (
          <div className="py-10 text-center">
            <TrendingUp className="h-10 w-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Chưa có hoa hồng nào</p>
            <p className="text-xs text-slate-300 mt-1">Chia sẻ link để bắt đầu kiếm tiền!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {data.commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center shrink-0">
                    <Users className="h-3.5 w-3.5 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.refereeName}</p>
                    <p className="text-[11px] text-slate-400">
                      Nạp {formatCurrency(c.depositAmount)} • {formatDate(c.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className="text-sm font-black text-emerald-600">+{formatCurrency(c.commissionAmount)}</span>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5",
                    c.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                    c.status === "pending" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {c.status === "paid" ? "Đã nhận" : c.status === "pending" ? "Chờ duyệt" : "Hết hạn"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
