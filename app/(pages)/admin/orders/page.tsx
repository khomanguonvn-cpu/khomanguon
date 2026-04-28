"use client";
export const runtime = 'edge';
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Order } from "@/types";
import { Eye, Search, Filter } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("/api/order");
        setOrders(response.data?.data || []);
      } catch {
        toast.error("Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = orders.filter(
    (o) =>
      String(o._id).includes(search) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng đơn", value: orders.length, color: "bg-blue-50 text-blue-600" },
          { label: "Chờ xử lý", value: orders.filter((o) => o.status === "pending").length, color: "bg-amber-50 text-amber-600" },
          { label: "Hoàn thành", value: orders.filter((o) => o.status === "completed").length, color: "bg-green-50 text-green-600" },
          { label: "Đã hủy", value: orders.filter((o) => o.status === "cancelled").length, color: "bg-red-50 text-red-600" },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-4 ${stat.color}`}>
            <p className="text-2xl font-extrabold">{stat.value}</p>
            <p className="text-sm font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Mã đơn</th>
                <th className="px-4 py-3 text-left font-semibold">Khách hàng</th>
                <th className="px-4 py-3 text-left font-semibold">Tổng tiền</th>
                <th className="px-4 py-3 text-left font-semibold">Thanh toán</th>
                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium">#{order._id}</td>
                    <td className="px-4 py-3">{order.user?.name || "—"}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(order.total || 0)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{order.paymentMethod || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || "bg-slate-100 text-slate-600"}`}>
                        {order.status === "pending" ? "Chờ xử lý" : order.status === "processing" ? "Đang xử lý" : order.status === "completed" ? "Hoàn thành" : order.status === "cancelled" ? "Đã hủy" : order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={`/order/${order._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-600 text-xs font-medium transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
