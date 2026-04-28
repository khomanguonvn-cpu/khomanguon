"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Mail, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactItem {
  id: number;
  subject: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function AdminContactsPage() {
  const [items, setItems] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewItem, setViewItem] = useState<ContactItem | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contacts?page=${page}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Chủ đề</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Tin nhắn</th>
                <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                <th className="px-4 py-3 text-center font-semibold">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>)
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Không có tin nhắn liên hệ nào</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">#{item.id}</td>
                  <td className="px-4 py-3 font-medium">{item.subject}</td>
                  <td className="px-4 py-3 text-slate-500">{item.email}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{item.message}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-center">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewItem(item)}><Eye className="h-3 w-3" /></Button>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold">{viewItem.subject}</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-500">Từ: <strong className="text-slate-900">{viewItem.email}</strong></p>
              <p className="text-sm text-slate-500">Ngày: {new Date(viewItem.createdAt).toLocaleString("vi-VN")}</p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm whitespace-pre-wrap">{viewItem.message}</div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Button variant="outline" onClick={() => setViewItem(null)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
