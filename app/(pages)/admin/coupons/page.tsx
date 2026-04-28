"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Coupon {
  id: number;
  code: string;
  discountPercent: number;
  active: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discountPercent: 10 });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ code: "", discountPercent: 0, active: true });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const json = await res.json();
      if (json.success) setCoupons(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    if (!form.code.trim()) return;
    try {
      const res = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) {
        toast.success("Tạo mã giảm giá thành công");
        setShowForm(false);
        setForm({ code: "", discountPercent: 10 });
        fetchCoupons();
      } else {
        toast.error(json.message || "Tạo mã giảm giá thất bại");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      const res = await fetch("/api/admin/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...editForm }) });
      const json = await res.json();
      if (json.success) {
        toast.success("Cập nhật mã giảm giá thành công");
        setEditId(null);
        fetchCoupons();
      } else {
        toast.error(json.message || "Cập nhật thất bại");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa mã giảm giá này?")) return;
    const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{coupons.length} mã giảm giá</p>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1"><Plus className="h-4 w-4" />Thêm mã</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Mã giảm giá mới</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Mã code (VD: SUMMER20)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="uppercase" />
            <Input placeholder="Giảm (%) (VD: 10)" type="number" min={1} max={100} value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleCreate}>Tạo</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Mã</th>
                <th className="px-4 py-3 text-left font-semibold">Giảm (%)</th>
                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold">Ngày tạo</th>
                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>)
              ) : coupons.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Chưa có mã giảm giá nào</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">#{c.id}</td>
                  <td className="px-4 py-3 font-bold font-mono">{c.code}</td>
                  <td className="px-4 py-3 text-green-600 font-bold">{c.discountPercent}%</td>
                  <td className="px-4 py-3">
                    {editId === c.id ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editForm.active} onChange={e => setEditForm({ ...editForm, active: e.target.checked })} className="rounded" />
                        <span className="text-xs">{editForm.active ? "Bật" : "Tắt"}</span>
                      </label>
                    ) : (
                      <Badge className={`text-xs ${c.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.active ? "Bật" : "Tắt"}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-center">
                    {editId === c.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" className="h-7 text-xs" onClick={handleUpdate}>Lưu</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditId(null)}>Hủy</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditId(c.id); setEditForm({ code: c.code, discountPercent: c.discountPercent, active: c.active }); }}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
