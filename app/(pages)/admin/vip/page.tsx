"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface VipTier {
  id: number;
  name: string;
  price: number;
  discountPercent: number;
  durationDays: number;
  active: boolean;
  createdAt: string;
}

const emptyForm = { name: "", price: 0, discountPercent: 0, durationDays: 30 };

export default function AdminVipPage() {
  const [tiers, setTiers] = useState<VipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vip");
      const json = await res.json();
      if (json.success) setTiers(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTiers(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        const res = await fetch("/api/admin/vip", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) });
        const json = await res.json();
        if (json.success) {
          toast.success("Cập nhật gói VIP thành công");
          setShowForm(false);
          setEditId(null);
          fetchTiers();
        } else {
          toast.error(json.message || "Cập nhật thất bại");
        }
      } else {
        const res = await fetch("/api/admin/vip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const json = await res.json();
        if (json.success) {
          toast.success("Tạo gói VIP thành công");
          setShowForm(false);
          fetchTiers();
        } else {
          toast.error(json.message || "Tạo thất bại");
        }
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa gói VIP này?")) return;
    const res = await fetch(`/api/admin/vip?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchTiers();
  };

  const openEdit = (t: VipTier) => {
    setForm({ name: t.name, price: t.price, discountPercent: t.discountPercent, durationDays: t.durationDays });
    setEditId(t.id);
    setShowForm(true);
  };

  const formatPrice = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(p);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{tiers.length} gói VIP</p>
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="gap-1"><Plus className="h-4 w-4" />Thêm gói</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{editId ? "Sửa gói VIP" : "Gói VIP mới"}</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Tên gói (VD: Gold, Silver)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Giá (VND)" type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            <Input placeholder="Giảm (%) cho VIP" type="number" min={1} max={100} value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: parseInt(e.target.value) || 0 })} />
            <Input placeholder="Thời hạn (ngày)" type="number" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave}>{editId ? "Cập nhật" : "Tạo"}</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
        ) : tiers.length === 0 ? (
          <p className="col-span-full text-center text-slate-400 py-12">Chưa có gói VIP nào</p>
        ) : tiers.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-6 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold">{t.name}</h3>
              </div>
              <Badge className={`text-xs ${t.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                {t.active ? "Bật" : "Tắt"}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-2xl font-extrabold text-primary-600">{formatPrice(t.price)}</p>
              <p className="text-slate-500">Thời hạn: <strong>{t.durationDays} ngày</strong></p>
              <p className="text-slate-500">Giảm giá: <strong className="text-green-600">{t.discountPercent}%</strong></p>
            </div>
            <div className="flex gap-1 mt-4">
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => openEdit(t)}><Pencil className="h-3 w-3 mr-1" />Sửa</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs text-red-500" onClick={() => handleDelete(t.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
