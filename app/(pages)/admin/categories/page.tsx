"use client";
import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Subcategory {
  id: number;
  categoryId: number;
  slug: string;
  name: string;
  description: string;
  listingMode: string;
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  subcategories: Subcategory[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editSub, setEditSub] = useState<{ catId: number; sub: Subcategory } | null>(null);
  const [subForm, setSubForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success) setCategories(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const handleCreateCat = async () => {
    const res = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
    if (res.ok) { setShowCatForm(false); setCatForm({ name: "", slug: "", description: "", sortOrder: 0 }); fetchCategories(); }
  };

  const handleUpdateCat = async () => {
    if (!editCat) return;
    const res = await fetch("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editCat.id, name: editCat.name, slug: editCat.slug, description: editCat.description, sortOrder: editCat.sortOrder }) });
    if (res.ok) { setEditCat(null); fetchCategories(); }
  };

  const handleDeleteCat = async (id: number) => {
    if (!confirm("Xóa danh mục và tất cả danh mục con?")) return;
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchCategories();
  };

  const handleUpdateSub = async () => {
    if (!editSub) return;
    const res = await fetch("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editSub.sub.id, type: "subcategory", ...subForm }) });
    if (res.ok) { setEditSub(null); fetchCategories(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{categories.length} danh mục</p>
        <Button onClick={() => setShowCatForm(!showCatForm)} className="gap-1"><Plus className="h-4 w-4" />Thêm danh mục</Button>
      </div>

      {showCatForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Danh mục mới</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowCatForm(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Tên danh mục" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} />
            <Input placeholder="Slug" value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} />
            <Input placeholder="Mô tả" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} />
            <Input placeholder="Thứ tự" type="number" value={catForm.sortOrder} onChange={e => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCatForm(false)}>Hủy</Button>
            <Button onClick={handleCreateCat}>Tạo</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : categories.length === 0 ? (
          <p className="p-12 text-center text-slate-400">Chưa có danh mục nào</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <button onClick={() => toggleExpand(cat.id)} className="text-slate-400">
                    {expanded.has(cat.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{cat.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{cat.slug}</span>
                      {!cat.isActive && <Badge variant="secondary" className="text-xs">Ẩn</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{cat.subcategories.length} danh mục con</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditCat(cat)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeleteCat(cat.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>

                {/* Edit Category */}
                {editCat && editCat.id === cat.id && (
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Tên" value={editCat.name} onChange={e => setEditCat({ ...editCat, name: e.target.value })} />
                      <Input placeholder="Slug" value={editCat.slug} onChange={e => setEditCat({ ...editCat, slug: e.target.value })} />
                      <Input placeholder="Mô tả" value={editCat.description} onChange={e => setEditCat({ ...editCat, description: e.target.value })} />
                      <Input placeholder="Thứ tự" type="number" value={editCat.sortOrder} onChange={e => setEditCat({ ...editCat, sortOrder: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={handleUpdateCat}>Lưu</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditCat(null)}>Hủy</Button>
                    </div>
                  </div>
                )}

                {/* Subcategories */}
                {expanded.has(cat.id) && cat.subcategories.length > 0 && (
                  <div className="bg-slate-50/50 divide-y divide-slate-100">
                    {cat.subcategories.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 px-4 py-2 pl-12 hover:bg-slate-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{sub.name}</span>
                            <span className="text-xs text-slate-400 font-mono">{sub.slug}</span>
                            <Badge variant="outline" className="text-xs">{sub.listingMode}</Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditSub({ catId: cat.id, sub }); setSubForm({ name: sub.name, slug: sub.slug, description: sub.description, sortOrder: sub.sortOrder }); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Subcategory */}
                {editSub && editSub.catId === cat.id && (
                  <div className="bg-slate-50 px-4 py-3 pl-12 border-b border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Tên" value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} />
                      <Input placeholder="Slug" value={subForm.slug} onChange={e => setSubForm({ ...subForm, slug: e.target.value })} />
                      <Input placeholder="Mô tả" value={subForm.description} onChange={e => setSubForm({ ...subForm, description: e.target.value })} />
                      <Input placeholder="Thứ tự" type="number" value={subForm.sortOrder} onChange={e => setSubForm({ ...subForm, sortOrder: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={handleUpdateSub}>Lưu</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditSub(null)}>Hủy</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
