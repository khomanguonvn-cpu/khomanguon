"use client";
import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface KycItem {
  id: number;
  userId: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  documentFrontUrl: string;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  status: string;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

export default function AdminKycPage() {
  const [items, setItems] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewItem, setViewItem] = useState<KycItem | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKyc = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/kyc?${params}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchKyc(); }, [fetchKyc]);

  const handleAction = async (id: number, action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, adminNote: adminNote || undefined }),
      });
      if (res.ok) {
        toast.success(action === "approve" ? "Đã duyệt thành công" : "Đã từ chối thành công");
        setViewItem(null);
        setAdminNote("");
        fetchKyc();
      } else {
        const json = await res.json();
        toast.error(json.message || "Thao tác thất bại");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setActionLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="">Tất cả</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Đã từ chối</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Người dùng</th>
                <th className="px-4 py-3 text-left font-semibold">Họ tên</th>
                <th className="px-4 py-3 text-left font-semibold">Loại giấy tờ</th>
                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold">Ngày tạo</th>
                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">Không có yêu cầu KYC nào</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">#{item.id}</td>
                  <td className="px-4 py-3">{item.userName || `#${item.userId}`}</td>
                  <td className="px-4 py-3 font-medium">{item.fullName}</td>
                  <td className="px-4 py-3 text-slate-500">{item.documentType}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${statusColor[item.status] || "bg-slate-100 text-slate-600"}`}>
                      {item.status === "pending" ? "Chờ duyệt" : item.status === "approved" ? "Đã duyệt" : "Đã từ chối"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-center">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setViewItem(item); setAdminNote(item.adminNote || ""); }}>
                      <Eye className="h-3 w-3 mr-1" />Xem
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Trang {page}/{totalPages}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8"><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Chi tiết KYC #{viewItem.id}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Người dùng:</span> <strong>{viewItem.userName || `#${viewItem.userId}`}</strong></div>
                <div><span className="text-slate-500">Email:</span> <strong>{viewItem.userEmail || ""}</strong></div>
                <div><span className="text-slate-500">Họ tên:</span> <strong>{viewItem.fullName}</strong></div>
                <div><span className="text-slate-500">Loại giấy tờ:</span> <strong>{viewItem.documentType}</strong></div>
                <div className="col-span-2"><span className="text-slate-500">Số giấy tờ:</span> <strong>{viewItem.documentNumber}</strong></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {viewItem.documentFrontUrl && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Mặt trước</p>
                    <Image src={viewItem.documentFrontUrl} alt="Mặt trước" className="rounded-lg border w-full" width={200} height={150} />
                  </div>
                )}
                {viewItem.documentBackUrl && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Mặt sau</p>
                    <Image src={viewItem.documentBackUrl} alt="Mặt sau" className="rounded-lg border w-full" width={200} height={150} />
                  </div>
                )}
                {viewItem.selfieUrl && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Ảnh chân dung</p>
                    <Image src={viewItem.selfieUrl} alt="Ảnh chân dung" className="rounded-lg border w-full" width={200} height={150} />
                  </div>
                )}
              </div>

              {viewItem.status === "pending" && (
                <div className="space-y-2 pt-2">
                  <Input placeholder="Ghi chú admin (tùy chọn)" value={adminNote} onChange={e => setAdminNote(e.target.value)} />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={actionLoading} onClick={() => handleAction(viewItem.id, "approve")}>
                      <CheckCircle className="h-4 w-4 mr-1" />Duyệt
                    </Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700" disabled={actionLoading} onClick={() => handleAction(viewItem.id, "reject")}>
                      <XCircle className="h-4 w-4 mr-1" />Từ chối
                    </Button>
                  </div>
                </div>
              )}

              {viewItem.reviewedAt && (
                <p className="text-xs text-slate-400">Đã xem xét: {new Date(viewItem.reviewedAt).toLocaleString("vi-VN")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
