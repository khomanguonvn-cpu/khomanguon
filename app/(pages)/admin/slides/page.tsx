"use client";
export const runtime = 'edge';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface SlideItem {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  btn: string;
  link: string;
  image: string;
  textColor: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = { slug: "", title: "", subtitle: "", btn: "", link: "", image: "", textColor: "#ffffff", sortOrder: 0 };

export default function AdminSlidesPage() {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SlideItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/slides");
      const json = await res.json();
      if (json.success) setSlides(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlides(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setShowForm(true); };
  const openEdit = (s: SlideItem) => { setForm({ slug: s.slug, title: s.title, subtitle: s.subtitle, btn: s.btn, link: s.link, image: s.image, textColor: s.textColor, sortOrder: s.sortOrder }); setEditing(s); setShowForm(true); };

  const handleSave = async () => {
    const url = editing ? "/api/admin/slides" : "/api/admin/slides";
    const method = editing ? "PATCH" : "POST";
    const body = editing ? { id: editing.id, ...form } : form;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setShowForm(false); fetchSlides(); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xác nhận xóa banner này?")) return;
    const res = await fetch(`/api/admin/slides?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchSlides();
  };

  const handleToggle = async (s: SlideItem) => {
    await fetch("/api/admin/slides", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, isActive: !s.isActive }) });
    fetchSlides();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{slides.length} banner</p>
        <Button onClick={openCreate} className="gap-1"><Plus className="h-4 w-4" />Thêm banner</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{editing ? "Sửa banner" : "Thêm banner mới"}</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
            <Input placeholder="Tiêu đề" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Phụ đề" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
            <Input placeholder="Nút (text)" value={form.btn} onChange={e => setForm({ ...form, btn: e.target.value })} />
            <Input placeholder="Link" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} />
            <Input placeholder="URL hình ảnh" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
            <Input placeholder="Màu chữ (#ffffff)" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} />
            <Input placeholder="Thứ tự" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave}>{editing ? "Cập nhật" : "Tạo"}</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
        ) : slides.length === 0 ? (
          <p className="col-span-full text-center text-slate-400 py-12">Chưa có banner nào</p>
        ) : slides.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {s.image && <Image src={s.image} alt={s.title} className="w-full h-32 object-cover" width={300} height={128} unoptimized />}
            <div className="p-4 space-y-1">
              <p className="font-bold text-sm truncate">{s.title || "(Không tiêu đề)"}</p>
              <p className="text-xs text-slate-500 truncate">{s.subtitle}</p>
              <p className="text-xs text-slate-400">Slug: {s.slug} | Thứ tự: {s.sortOrder}</p>
              <div className="flex items-center gap-2 pt-2">
                <button onClick={() => handleToggle(s)} className={`text-xs px-2 py-1 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {s.isActive ? "Hiện" : "Ẩn"}
                </button>
                <div className="flex gap-1 ml-auto">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(s.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
