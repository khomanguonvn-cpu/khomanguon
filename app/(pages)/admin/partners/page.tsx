"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type PartnerBrandLogo = {
  id: number;
  name: string;
  logoUrl: string;
  link: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type PartnerForm = {
  name: string;
  logoUrl: string;
  link: string;
  sortOrder: number;
};

const emptyForm: PartnerForm = {
  name: "",
  logoUrl: "",
  link: "",
  sortOrder: 0,
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminPartnersPage() {
  const [items, setItems] = useState<PartnerBrandLogo[]>([]);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [editing, setEditing] = useState<PartnerBrandLogo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/partners", { cache: "no-store" });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể tải logo đối tác"));
      }

      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải logo đối tác"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPartners();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (item: PartnerBrandLogo) => {
    setForm({
      name: item.name,
      logoUrl: item.logoUrl,
      link: item.link || "",
      sortOrder: item.sortOrder || 0,
    });
    setEditing(item);
    setShowForm(true);
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("folder", "partner-logos");

      const response = await fetch("/api/upload-direct", {
        method: "POST",
        body: uploadForm,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Upload logo thất bại"));
      }

      const publicUrl = String(json?.publicUrl || "").trim();
      if (!publicUrl) {
        throw new Error("Không nhận được URL logo sau khi upload");
      }

      setForm((prev) => ({ ...prev, logoUrl: publicUrl }));
      toast.success("Đã upload logo");
    } catch (error) {
      toast.error(getErrorMessage(error, "Upload logo thất bại"));
    } finally {
      setUploading(false);
    }
  };

  const savePartner = async () => {
    const name = form.name.trim();
    const logoUrl = form.logoUrl.trim();
    const link = form.link.trim();

    if (!name) {
      toast.error("Vui lòng nhập tên đối tác");
      return;
    }

    if (!logoUrl) {
      toast.error("Vui lòng nhập hoặc upload logo");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        logoUrl,
        link,
        sortOrder: Number(form.sortOrder) || 0,
      };
      const response = await fetch("/api/admin/partners", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể lưu logo đối tác"));
      }

      toast.success(editing ? "Đã cập nhật logo đối tác" : "Đã thêm logo đối tác");
      resetForm();
      await fetchPartners();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể lưu logo đối tác"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: PartnerBrandLogo) => {
    try {
      const response = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể cập nhật trạng thái"));
      }

      await fetchPartners();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật trạng thái"));
    }
  };

  const deletePartner = async (item: PartnerBrandLogo) => {
    if (!confirm(`Xác nhận xóa logo "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/partners?id=${item.id}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể xóa logo đối tác"));
      }

      toast.success("Đã xóa logo đối tác");
      await fetchPartners();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xóa logo đối tác"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{items.length} logo đối tác</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchPartners} className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <Button onClick={openCreate} className="gap-1">
            <Plus className="h-4 w-4" />
            Thêm logo
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">
              {editing ? "Sửa logo đối tác" : "Thêm logo đối tác"}
            </h2>
            <Button variant="ghost" size="icon-sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Tên đối tác</label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Ví dụ: OpenAI"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Thứ tự</label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      sortOrder: Number(event.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-600">Link khi bấm vào logo</label>
                <Input
                  value={form.link}
                  onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-600">URL logo</label>
                <Input
                  value={form.logoUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, logoUrl: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-600">Upload logo</label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadLogo(file);
                      event.target.value = "";
                    }}
                  />
                  {uploading && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang upload
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-center min-h-[140px]">
              {form.logoUrl ? (
                <Image
                  src={form.logoUrl}
                  alt={form.name || "Logo đối tác"}
                  width={150}
                  height={90}
                  className="max-h-24 w-auto object-contain"
                  unoptimized
                />
              ) : (
                <div className="text-center text-xs text-slate-400">Chưa có logo</div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Hủy
            </Button>
            <Button onClick={savePartner} disabled={saving || uploading} className="gap-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? "Cập nhật" : "Lưu logo"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))
        ) : items.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
            Chưa có logo đối tác nào
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <div className="h-28 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
                <Image
                  src={item.logoUrl}
                  alt={item.name}
                  width={160}
                  height={96}
                  className="max-h-20 w-auto object-contain"
                  unoptimized
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                  <span className="text-xs text-slate-400 shrink-0">#{item.sortOrder}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{item.link || "Không gắn link"}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={item.isActive ? "success" : "secondary"}
                  onClick={() => void toggleActive(item)}
                  className="gap-1"
                >
                  {item.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {item.isActive ? "Đang hiện" : "Đang ẩn"}
                </Button>
                <div className="ml-auto flex gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => void deletePartner(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
