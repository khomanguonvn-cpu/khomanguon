
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
  ArrowRight,
  UserCircle2,
} from "lucide-react";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";

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

  const statCards = [
    { value: stats.totalOrders, label: "Tổng đơn hàng", icon: ShoppingBag, gradient: "from-blue-500 to-indigo-500" },
    { value: stats.completed, label: "Đơn đã nhận", icon: CheckCircle, gradient: "from-emerald-500 to-green-500" },
    { value: stats.pending, label: "Đang xử lý", icon: Clock, gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome header */}
      <AccountPageHeader
        icon={UserCircle2}
        title={`Xin chào, ${session?.user?.name || "Khách hàng"}!`}
        subtitle="Chào mừng bạn quay trở lại KHOMANGUON.IO.VN"
        gradient="from-primary-600 via-indigo-600 to-primary-700"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={i}
              className="min-w-0 bg-white border border-slate-200 p-4 sm:p-5 hover:border-primary-200 transition-all"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white`}
                  style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
                >
                  <StatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">{stat.label}</p>
            </div>
          );
        })}

        {/* Total spent card */}
        <div
          className="min-w-0 bg-white border border-slate-200 p-4 sm:p-5 hover:border-primary-200 transition-all"
          style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white"
              style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
            >
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 truncate" title={`${new Intl.NumberFormat("vi-VN").format(stats.totalSpent)}đ`}>
            {new Intl.NumberFormat("vi-VN").format(stats.totalSpent)}đ
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Tổng chi tiêu</p>
        </div>
      </div>

      <WalletCard />

      {/* Quick access - Security */}
      <div
        className="bg-white border border-slate-200 p-5"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-900 uppercase tracking-wider text-sm">Truy cập nhanh</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { href: "/account/kyc", icon: Store, title: "Đăng ký bán hàng", desc: "Mở quyền tạo sản phẩm seller" },
            { href: "/account/kyc", icon: ShieldCheck, title: "KYC CCCD", desc: "Xác minh danh tính người bán" },
            { href: "/account/bank", icon: Landmark, title: "Thông tin ngân hàng", desc: "Lưu để rút tiền tự động" },
            { href: "/forgot-password", icon: KeyRound, title: "Quên mật khẩu OTP", desc: "OTP email để đổi mật khẩu" },
          ].map((item) => {
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href + item.title}
                href={item.href}
                className="border border-slate-200 px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-all clip-angular-sm group"
              >
                <ItemIcon className="w-5 h-5 text-primary-600 mb-1" />
                <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent orders */}
      <div
        className="bg-white border border-slate-200 overflow-hidden"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-sm">
            <Package className="w-5 h-5 text-primary-600" />
            Đơn hàng gần đây
          </h2>
          <Link
            href="/account/order"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-bold"
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
                  <div
                    className="w-10 h-10 bg-slate-100 flex items-center justify-center clip-angular-sm"
                  >
                    <Package className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">#{String(order._id || "").slice(-8)}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(order.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">
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
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-primary-700 transition-colors clip-angular-sm"
            >
              Mua sắm ngay
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/products", icon: ShoppingBag, title: "Mua sắm", desc: "Khám phá sản phẩm" },
          { href: "/account/order", icon: Package, title: "Đơn hàng", desc: "Xem lịch sử mua" },
          { href: "/account/profile", icon: UserCircle2, title: "Hồ sơ", desc: "Cập nhật thông tin" },
          { href: "/account/kyc", icon: Store, title: "Kênh người bán", desc: "Đăng ký & KYC" },
        ].map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-slate-200 p-4 hover:border-primary-200 transition-all text-center group clip-angular-sm"
            >
              <div className="w-10 h-10 mx-auto mb-2 bg-primary-100 text-primary-600 flex items-center justify-center clip-angular-sm">
                <ItemIcon className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-900 text-sm">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Tổng quan - Tài khoản",
  description: "Quản lý tài khoản và theo dõi hoạt động trên KHOMANGUON.IO.VN",
};
