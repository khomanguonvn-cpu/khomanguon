"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Register from "@/components/modules/website/auth/Register";
import Logo from "@/components/modules/custom/Logo";
import { useSearchParams, useRouter } from "next/navigation";

function RefBanner() {
  const params = useSearchParams();
  const ref = params?.get("ref");
  if (!ref) return null;
  return (
    <div className="max-w-md mx-auto px-4 mb-4">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-50 to-primary-50 border border-violet-200">
        {/* Gift SVG */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-violet-600 shrink-0">
          <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-bold text-violet-700 leading-tight">Bạn được giới thiệu qua Affiliate!</p>
          <p className="text-[11px] text-violet-500 mt-0.5">Đăng ký ngay để người giới thiệu nhận hoa hồng khi bạn nạp tiền.</p>
        </div>
        <span className="shrink-0 font-mono text-xs font-black text-violet-700 bg-violet-100 px-2 py-1 rounded-lg">{ref}</span>
      </div>
    </div>
  );
}

function RegisterContent() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-violet-50/20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <Link href="/"><Logo size="sm" /></Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Trang chủ
        </Link>
      </header>

      {/* Title */}
      <div className="text-center pt-8 pb-2 px-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-xs font-semibold text-primary-700 mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Tạo tài khoản miễn phí
        </span>
        <h1 className="text-2xl font-black text-slate-900">Đăng ký KhoMaNguon</h1>
        <p className="text-sm text-slate-500 mt-1">Mua sắm sản phẩm số, tài khoản AI và nhiều hơn nữa</p>
      </div>

      {/* Affiliate banner (only if ref= param present) */}
      <Suspense fallback={null}>
        <RefBanner />
      </Suspense>

      {/* Register form - uses built-in Container/layout in page mode */}
      <div className="flex-1 pt-0 pb-8">
        <Register
          mode="page"
          onSuccess={() => router.push("/")}
        />
      </div>

      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-100">
        © {new Date().getFullYear()} KhoMaNguon · Sản phẩm số uy tín
      </footer>
    </div>
  );
}

export default function RegisterPageClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
