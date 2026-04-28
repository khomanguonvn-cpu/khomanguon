import { getOrdersByUserId } from "@/actions/order";
import auth from "@/auth";
import WalletCard from "@/components/modules/website/account/WalletCard";
import { Order } from "@/types";
import { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle,
  ChevronRight,
  Clock,
  KeyRound,
  Landmark,
  Package,
  ShoppingBag,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const orders = await getOrdersByUserId(session?.user?.id);

  const stats = {
    totalOrders: orders.length,
    completed: orders.filter((item: Order) => item.shippingStatus === "completed").length,
    pending: orders.filter((item: Order) => item.shippingStatus === "pending").length,
    totalSpent: orders
      .filter((item: Order) => item.isPaid === true)
      .reduce((total: number, item: Order) => total + (item.total || 0), 0),
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Xin chào, {session?.user?.name || "Khách hàng"}!
        </h1>
        <p className="text-primary-100">Chào mừng bạn quay trở lại KHOMANGUON.IO.VN</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="min-w-0 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalOrders}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Tổng đơn hàng</p>
        </div>

        <div className="min-w-0 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.completed}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Đơn đã nhận</p>
        </div>

        <div className="min-w-0 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.pending}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Đơn đang xử lý</p>
        </div>

        <div className="min-w-0 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate" title={`${new Intl.NumberFormat("vi-VN").format(stats.totalSpent)}đ`}>
            {new Intl.NumberFormat("vi-VN").format(stats.totalSpent)}đ
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Tổng chi tiêu</p>
        </div>
      </div>

      <WalletCard />

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-900">Truy cập nhanh bảo mật & xác minh</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Link
            href="/account/kyc"
            className="rounded-xl border border-slate-200 px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Store className="w-5 h-5 text-primary-600 mb-1" />
            <p className="font-medium text-slate-900">Đăng ký bán hàng</p>
            <p className="text-xs text-slate-500">Mở quyền tạo sản phẩm seller</p>
          </Link>
          <Link
            href="/account/kyc"
            className="rounded-xl border border-slate-200 px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <ShieldCheck className="w-5 h-5 text-primary-600 mb-1" />
            <p className="font-medium text-slate-900">KYC CCCD</p>
            <p className="text-xs text-slate-500">Xác minh danh tính người bán</p>
          </Link>
          <Link
            href="/account/bank"
            className="rounded-xl border border-slate-200 px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Landmark className="w-5 h-5 text-primary-600 mb-1" />
            <p className="font-medium text-slate-900">Thông tin ngân hàng</p>
            <p className="text-xs text-slate-500">Lưu để rút tiền, tự động điền biểu mẫu</p>
          </Link>
          <Link
            href="/forgot-password"
            className="rounded-xl border border-slate-200 px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <KeyRound className="w-5 h-5 text-primary-600 mb-1" />
            <p className="font-medium text-slate-900">Quên mật khẩu OTP</p>
            <p className="text-xs text-slate-500">Bắt buộc OTP email để đổi mật khẩu</p>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            Đơn hàng gần đây
          </h2>
          <Link
            href="/account/order"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order: Order) => (
              <Link
                key={order._id}
                href={`/order/${order._id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">#{String(order._id || "").slice(-8)}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(order.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-900">
                    {new Intl.NumberFormat("vi-VN").format(order.total || 0)}đ
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Chưa có đơn hàng nào</p>
            <Link
              href="/products"
              className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Mua sắm ngay
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/products"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-primary-200 transition-all text-center"
        >
          <ShoppingBag className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="font-medium text-slate-900">Mua sắm</p>
          <p className="text-xs text-slate-500 mt-1">Khám phá sản phẩm</p>
        </Link>
        <Link
          href="/account/order"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-primary-200 transition-all text-center"
        >
          <Package className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="font-medium text-slate-900">Đơn hàng</p>
          <p className="text-xs text-slate-500 mt-1">Xem lịch sử mua</p>
        </Link>
        <Link
          href="/account/profile"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-primary-200 transition-all text-center"
        >
          <svg
            className="w-8 h-8 text-primary-600 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <p className="font-medium text-slate-900">Hồ sơ</p>
          <p className="text-xs text-slate-500 mt-1">Cập nhật thông tin</p>
        </Link>
        <Link
          href="/account/kyc"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-primary-200 transition-all text-center"
        >
          <Store className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="font-medium text-slate-900">Kênh người bán</p>
          <p className="text-xs text-slate-500 mt-1">Đăng ký bán hàng & KYC CCCD</p>
        </Link>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Tổng quan - Tài khoản",
  description: "Quản lý tài khoản và theo dõi hoạt động trên KHOMANGUON.IO.VN",
};
