export const runtime = 'edge';

import auth from "@/auth";
import { getUserById } from "@/actions/user";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, KeyRound, Landmark, MailCheck, ShieldCheck, Wallet, AlertCircle } from "lucide-react";

export default async function SecurityPage() {
  const session = await auth();
  const user = await getUserById(session?.user?.id);

  const emailVerified = Boolean(user?.emailVerified);

  return (
    <div className="space-y-5">
      <AccountPageHeader
        icon={ShieldCheck}
        title="Trung tâm bảo mật OTP"
        subtitle="OTP được áp dụng cho thao tác nhạy cảm — tránh đổi thông tin trái phép."
        gradient="from-emerald-600 via-green-600 to-teal-600"
      />

      {/* Email OTP status + protected flows */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
              <MailCheck className="h-5 w-5 text-primary-600" />
            </div>
            <p className="font-semibold text-slate-900">Trạng thái email OTP</p>
          </div>
          <div
            className={
              emailVerified
                ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700"
                : "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700"
            }
          >
            {emailVerified ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {emailVerified ? "Đã xác thực email" : "Chưa xác thực email"}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Email là kênh nhận OTP cho đổi mật khẩu, liên kết ngân hàng và rút tiền.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-900">Luồng yêu cầu OTP</p>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Đổi mật khẩu khi đã đăng nhập.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Thêm ngân hàng rút tiền mới.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Gửi yêu cầu rút tiền từ ví.
            </li>
          </ul>
        </div>
      </div>

      {/* Password flows */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
            <KeyRound className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Phân biệt 2 thao tác mật khẩu</p>
            <p className="text-xs text-slate-500">Chọn đúng luồng để tránh thao tác sai.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/account/profile"
            className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-primary-300 hover:bg-primary-50"
          >
            <p className="font-semibold text-slate-900">Đổi mật khẩu</p>
            <p className="text-sm text-slate-600">
              Thực hiện trong trang Hồ sơ khi bạn đã đăng nhập, bắt buộc OTP.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:underline">
              Mở trang Hồ sơ
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/forgot-password"
            className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-primary-300 hover:bg-primary-50"
          >
            <p className="font-semibold text-slate-900">Quên mật khẩu</p>
            <p className="text-sm text-slate-600">
              Khi không đăng nhập được. Hệ thống gửi OTP để đặt mật khẩu mới.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:underline">
              Mở trang Quên mật khẩu
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/account/bank"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
        >
          <span className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Landmark className="h-5 w-5 text-blue-600" />
            </span>
            <span className="font-medium text-slate-800">Quản lý ngân hàng rút tiền</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/account/wallet"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
        >
          <span className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </span>
            <span className="font-medium text-slate-800">Rút tiền có OTP</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Bảo mật OTP - Tài khoản",
  description: "Quản lý xác thực OTP cho các thao tác bảo mật tài khoản",
};
