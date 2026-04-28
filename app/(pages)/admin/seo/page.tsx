"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { BarChart3, CheckCircle2, Code2, Download, ExternalLink, Globe, Save, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import toast from "react-hot-toast";

const BASE_URL = "https://khomanguon.io.vn";

const emptySeo = {
  siteTitle: "",
  metaDescription: "",
  keywords: "",
  ogImage: "",
  favicon: "",
  twitterHandle: "",
  facebookUrl: "",
  analyticsGoogleId: "",
  analyticsGtmId: "",
  schemaOrganizationName: "",
  schemaOrganizationUrl: "",
  schemaOrganizationLogo: "",
  schemaWebsiteName: "",
  schemaCustomJson: "",
};

export default function AdminSeoPage() {
  const [form, setForm] = useState(emptySeo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "social" | "analytics" | "schema">("general");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/seo");
        const json = await res.json();
        if (json.success) {
          setForm({ ...emptySeo, ...json.data });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromJson = async () => {
    if (!confirm("Đồng bộ dữ liệu Schema từ file JSON? Dữ liệu hiện tại sẽ bị ghi đè.")) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/seo/sync-schema", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        // Reload form data
        const seoRes = await fetch("/api/admin/seo");
        const seoJson = await seoRes.json();
        if (seoJson.success) {
          setForm({ ...emptySeo, ...seoJson.data });
        }
        toast.success("Đã đồng bộ Schema từ JSON thành công!");
      } else {
        toast.error(json.message || "Lỗi khi đồng bộ");
      }
    } catch {
      toast.error("Lỗi kết nối khi đồng bộ");
    } finally {
      setSyncing(false);
    }
  };

  const metaDescLength = form.metaDescription.length;
  const isDescOk = metaDescLength >= 120 && metaDescLength <= 160;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const tabs = [
    { id: "general" as const, label: "Chung", icon: Globe },
    { id: "social" as const, label: "Mạng xã hội", icon: Search },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
    { id: "schema" as const, label: "Schema JSON-LD", icon: Code2 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-bold flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cài đặt SEO đồng bộ trang chủ
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={`${BASE_URL}/sitemap.xml`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline flex items-center gap-1"
            >
              <Globe className="h-3 w-3" />
              Sitemap
            </a>
            <a
              href={`${BASE_URL}/robots.txt`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline flex items-center gap-1"
            >
              <Globe className="h-3 w-3" />
              Robots.txt
            </a>
            <a
              href={`${BASE_URL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Xem website
            </a>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Cấu hình SEO tại đây sẽ tự động áp dụng cho trang chủ, sitemap và các trang khác.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: General */}
        {activeTab === "general" && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Tiêu đề trang chủ (Title)</label>
              <Input
                placeholder="KHOMANGUON.IO.VN - Chợ sản phẩm số"
                value={form.siteTitle}
                onChange={(event) => setForm({ ...form, siteTitle: event.target.value })}
              />
              <p className="text-xs mt-1 text-slate-400">
                Nên dùng 50-60 ký tự. Hiện tại: {form.siteTitle.length} ký tự
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Mô tả Meta (Description)</label>
              <textarea
                className={`w-full border rounded-xl px-3 py-2 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-primary-500 ${
                  metaDescLength > 0 && !isDescOk ? "border-amber-400" : "border-slate-200"
                }`}
                placeholder="Mô tả ngắn gọn website dành cho Google (120-160 ký tự)"
                value={form.metaDescription}
                onChange={(event) => setForm({ ...form, metaDescription: event.target.value })}
              />
              <p className={`text-xs mt-1 ${isDescOk ? "text-green-600" : metaDescLength > 0 ? "text-amber-500" : "text-slate-400"}`}>
                {metaDescLength}/160 ký tự
                {metaDescLength > 0 && !isDescOk && " (nên 120-160 ký tự)"}
                {isDescOk && " ✓"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Từ khóa (Keywords)</label>
              <Input
                placeholder="mã nguồn, tài khoản số, AI, SaaS, MMO, mua bán sản phẩm số"
                value={form.keywords}
                onChange={(event) => setForm({ ...form, keywords: event.target.value })}
              />
              <p className="text-xs mt-1 text-slate-400">Phân cách bằng dấu phẩy. Google hiện không dùng keywords để xếp hạng nhưng vẫn hữu ích.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Favicon URL</label>
              <Input
                placeholder="https://khomanguon.io.vn/assets/images/logo.png"
                value={form.favicon}
                onChange={(event) => setForm({ ...form, favicon: event.target.value })}
              />
            </div>
          </div>
        )}

        {/* Tab: Social */}
        {activeTab === "social" && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Ảnh chia sẻ (OG Image)</label>
              <Input
                placeholder="https://khomanguon.io.vn/assets/images/og.png"
                value={form.ogImage}
                onChange={(event) => setForm({ ...form, ogImage: event.target.value })}
              />
              <p className="text-xs mt-1 text-slate-400">Kích thước đề xuất: 1200x630px cho Facebook/Open Graph</p>
              {form.ogImage && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 w-64">
                  <Image src={form.ogImage} alt="OG Preview" className="w-full h-auto" width={256} height={160} onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Twitter Handle</label>
                <Input
                  placeholder="@khomanguon"
                  value={form.twitterHandle}
                  onChange={(event) => setForm({ ...form, twitterHandle: event.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Facebook URL</label>
                <Input
                  placeholder="https://facebook.com/khomanguon"
                  value={form.facebookUrl}
                  onChange={(event) => setForm({ ...form, facebookUrl: event.target.value })}
                />
              </div>
            </div>

            {/* Google Search Preview */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Google Search Preview
              </p>
              <div className="bg-slate-50 rounded-xl p-4 space-y-1 max-w-xl">
                <p className="text-lg text-blue-700 hover:underline cursor-pointer truncate">
                  {form.siteTitle || "Tiêu đề trang web của bạn"}
                </p>
                <p className="text-sm text-green-700 truncate">
                  {BASE_URL}
                </p>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {form.metaDescription || "Mô tả trang web của bạn sẽ hiển thị ở đây..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Google Analytics ID (GA4)</label>
                <Input
                  placeholder="G-XXXXXXXXXX"
                  value={form.analyticsGoogleId}
                  onChange={(event) => setForm({ ...form, analyticsGoogleId: event.target.value })}
                />
                <p className="text-xs mt-1 text-slate-400">Dùng GA4 (G-...). Lấy từ Google Analytics.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Google Tag Manager ID</label>
                <Input
                  placeholder="GTM-XXXXXXX"
                  value={form.analyticsGtmId}
                  onChange={(event) => setForm({ ...form, analyticsGtmId: event.target.value })}
                />
                <p className="text-xs mt-1 text-slate-400">GTM giúp quản lý nhiều tag tracking cùng lúc.</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">Cách lấy Google Analytics GA4:</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-700">
                <li>Đăng nhập <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="underline">analytics.google.com</a></li>
                <li>Vào Admin → Property → Data Streams → Chọn website stream</li>
                <li>Copy <strong>Measurement ID</strong> (bắt đầu bằng G-)</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab: Schema */}
        {activeTab === "schema" && (
          <div className="space-y-4 pt-2">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold mb-1">Schema JSON-LD là gì?</p>
                <p>Schema giúp Google hiểu rõ hơn về nội dung website, tăng khả năng hiển thị rich snippets trong kết quả tìm kiếm.</p>
              </div>
              <button
                onClick={handleSyncFromJson}
                disabled={syncing}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {syncing ? "Đang đồng bộ..." : "Đồng bộ từ JSON"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Tên tổ chức</label>
                <Input
                  placeholder="KHOMANGUON.IO.VN"
                  value={form.schemaOrganizationName}
                  onChange={(event) => setForm({ ...form, schemaOrganizationName: event.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Tên website</label>
                <Input
                  placeholder="KHOMANGUON.IO.VN"
                  value={form.schemaWebsiteName}
                  onChange={(event) => setForm({ ...form, schemaWebsiteName: event.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">URL tổ chức</label>
                <Input
                  placeholder="https://khomanguon.io.vn"
                  value={form.schemaOrganizationUrl}
                  onChange={(event) => setForm({ ...form, schemaOrganizationUrl: event.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Logo tổ chức</label>
                <Input
                  placeholder="https://khomanguon.io.vn/assets/images/logo.png"
                  value={form.schemaOrganizationLogo}
                  onChange={(event) => setForm({ ...form, schemaOrganizationLogo: event.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Schema tùy chỉnh (JSON-LD)</label>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-primary-500 font-mono text-xs"
                placeholder='{"@context":"https://schema.org","@type":"Organization","name":"..."}'
                value={form.schemaCustomJson}
                onChange={(event) => setForm({ ...form, schemaCustomJson: event.target.value })}
              />
              <p className="text-xs mt-1 text-slate-400">Thêm schema bổ sung như FAQ, Breadcrumb, LocalBusiness, v.v.</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <Button onClick={handleSave} disabled={saving} className="gap-1">
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Đã lưu thành công
            </span>
          )}
        </div>
      </div>

      {/* SEO Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          SEO Checklist
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Tiêu đề trang (Title)", ok: form.siteTitle.length > 0, note: `${form.siteTitle.length} ký tự` },
            { label: "Mô tả Meta (Description)", ok: isDescOk, note: `${metaDescLength}/160 ký tự` },
            { label: "OG Image", ok: form.ogImage.length > 0, note: "Ảnh chia sẻ mạng xã hội" },
            { label: "Google Analytics", ok: form.analyticsGoogleId.length > 0, note: "Theo dõi lưu lượng" },
            { label: "GTM ID", ok: form.analyticsGtmId.length > 0, note: "Quản lý tags" },
            { label: "Schema Organization", ok: form.schemaOrganizationName.length > 0, note: "Rich snippets" },
            { label: "Favicon", ok: form.favicon.length > 0, note: "Icon trên tab trình duyệt" },
            { label: "Twitter Card", ok: form.twitterHandle.length > 0, note: "Hiển thị trên Twitter" },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-2 text-sm ${item.ok ? "text-green-700" : "text-amber-600"}`}>
              {item.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-amber-400 shrink-0" />
              )}
              <span className="font-medium">{item.label}</span>
              <span className="text-xs text-slate-400 ml-auto">{item.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

