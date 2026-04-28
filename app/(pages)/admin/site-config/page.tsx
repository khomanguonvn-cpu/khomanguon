"use client";

import React, { useEffect, useState } from "react";
import {
  Save,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Megaphone,
  Layout,
  Send,
  Youtube,
  Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

const emptyConfig = {
  contactEmail: "",
  contactPhone: "",
  announcementText: "",
  announcementLink: "",
  announcementEnabled: "false",
  facebookUrl: "",
  youtubeUrl: "",
  zaloUrl: "",
  telegramUrl: "",
  tiktokUrl: "",
  footerEmail: "",
  footerPhone: "",
  footerAddress: "",
  footerDescription: "",
  copyrightText: "",
  paymentMethods: "",
};

export default function AdminSiteConfigPage() {
  const [form, setForm] = useState(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "topbar" | "footer" | "social" | "advanced"
  >("topbar");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/site-config");
        const json = await res.json();
        if (json.success) {
          setForm({ ...emptyConfig, ...json.data });
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
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        toast.success("Đã lưu cấu hình thành công!");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error("Lỗi khi lưu cấu hình");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const tabs = [
    { id: "topbar" as const, label: "Thanh trên cùng", icon: Layout },
    { id: "footer" as const, label: "Chân trang", icon: Mail },
    { id: "social" as const, label: "Mạng xã hội", icon: Globe },
    { id: "advanced" as const, label: "Nâng cao", icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <Layout className="h-5 w-5 text-primary-600" />
              Cấu hình giao diện Website
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Chỉnh sửa thông tin hiển thị trên thanh trên cùng (TopBar) và chân
              trang (Footer) của website.
            </p>
          </div>
        </div>

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

        {/* Tab: TopBar */}
        {activeTab === "topbar" && (
          <div className="space-y-5 pt-2">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">Thanh trên cùng (TopBar)</p>
              <p>
                Đây là thanh nằm ở trên cùng trang web, hiển thị email liên hệ,
                số điện thoại và thông tin tài khoản người dùng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  <Mail className="inline h-3.5 w-3.5 mr-1" />
                  Email liên hệ
                </label>
                <Input
                  placeholder="contact@khomanguon.io.vn"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                />
                <p className="text-xs mt-1 text-slate-400">
                  Hiển thị bên trái TopBar
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  <Phone className="inline h-3.5 w-3.5 mr-1" />
                  Số điện thoại
                </label>
                <Input
                  placeholder="0868 686 868"
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm({ ...form, contactPhone: e.target.value })
                  }
                />
                <p className="text-xs mt-1 text-slate-400">
                  Hiển thị bên trái TopBar
                </p>
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Megaphone className="h-4 w-4 text-amber-500" />
                  Thông báo dạng banner (tuỳ chọn)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.announcementEnabled === "true"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        announcementEnabled: e.target.checked
                          ? "true"
                          : "false",
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  Bật hiển thị
                </label>
              </div>
              <Input
                placeholder="🔥 Khuyến mãi 50% tất cả sản phẩm - Chỉ hôm nay!"
                value={form.announcementText}
                onChange={(e) =>
                  setForm({ ...form, announcementText: e.target.value })
                }
              />
              <Input
                placeholder="https://khomanguon.io.vn/products (link khi bấm vào)"
                value={form.announcementLink}
                onChange={(e) =>
                  setForm({ ...form, announcementLink: e.target.value })
                }
              />
              <p className="text-xs text-slate-400">
                Nếu bật, sẽ hiển thị một thanh thông báo phía trên TopBar.
              </p>
            </div>

            {/* Preview */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Xem trước TopBar
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200">
                {form.announcementEnabled === "true" &&
                  form.announcementText && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center text-xs py-1.5 font-medium">
                      {form.announcementText}
                    </div>
                  )}
                <div className="bg-primary-600 text-white">
                  <div className="flex h-10 items-center justify-between px-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 opacity-90">
                        <Mail className="h-3.5 w-3.5" />
                        {form.contactEmail || "email@example.com"}
                      </span>
                      <div className="h-4 w-px bg-white/20" />
                      <span className="flex items-center gap-1.5 opacity-90">
                        <Phone className="h-3.5 w-3.5" />
                        {form.contactPhone || "0123 456 789"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Footer */}
        {activeTab === "footer" && (
          <div className="space-y-5 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
              <p className="font-semibold mb-1">Chân trang (Footer)</p>
              <p>
                Thông tin liên hệ, mô tả và bản quyền hiển thị ở phần cuối
                trang.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Mô tả website
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nền tảng marketplace chuyên cung cấp các sản phẩm số..."
                value={form.footerDescription}
                onChange={(e) =>
                  setForm({ ...form, footerDescription: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Email chân trang
                </label>
                <Input
                  placeholder="contact@khomanguon.io.vn"
                  value={form.footerEmail}
                  onChange={(e) =>
                    setForm({ ...form, footerEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Số điện thoại chân trang
                </label>
                <Input
                  placeholder="0868 686 868"
                  value={form.footerPhone}
                  onChange={(e) =>
                    setForm({ ...form, footerPhone: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Địa chỉ (tuỳ chọn)
              </label>
              <Input
                placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                value={form.footerAddress}
                onChange={(e) =>
                  setForm({ ...form, footerAddress: e.target.value })
                }
              />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Dòng bản quyền (để trống = tự động)
                </label>
                <Input
                  placeholder={`© ${new Date().getFullYear()} KHOMANGUON.IO.VN — Bảo lưu mọi quyền.`}
                  value={form.copyrightText}
                  onChange={(e) =>
                    setForm({ ...form, copyrightText: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Phương thức thanh toán
                </label>
                <Input
                  placeholder="Visa,Mastercard,PayPal,Chuyển khoản"
                  value={form.paymentMethods}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethods: e.target.value })
                  }
                />
                <p className="text-xs mt-1 text-slate-400">
                  Phân cách bằng dấu phẩy. Ví dụ: Visa,Mastercard,Momo,ZaloPay
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Social */}
        {activeTab === "social" && (
          <div className="space-y-5 pt-2">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
              <p className="font-semibold mb-1">Liên kết mạng xã hội</p>
              <p>
                Các link mạng xã hội sẽ hiển thị dưới dạng icon ở chân trang.
                Để trống nếu không muốn hiển thị.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  <Facebook className="inline h-3.5 w-3.5 mr-1 text-blue-600" />
                  Facebook
                </label>
                <Input
                  placeholder="https://facebook.com/khomanguon"
                  value={form.facebookUrl}
                  onChange={(e) =>
                    setForm({ ...form, facebookUrl: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  <Youtube className="inline h-3.5 w-3.5 mr-1 text-red-600" />
                  YouTube
                </label>
                <Input
                  placeholder="https://youtube.com/@khomanguon"
                  value={form.youtubeUrl}
                  onChange={(e) =>
                    setForm({ ...form, youtubeUrl: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  <MessageCircle className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
                  Zalo
                </label>
                <Input
                  placeholder="https://zalo.me/0868686868"
                  value={form.zaloUrl}
                  onChange={(e) =>
                    setForm({ ...form, zaloUrl: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  <Send className="inline h-3.5 w-3.5 mr-1 text-sky-500" />
                  Telegram
                </label>
                <Input
                  placeholder="https://t.me/khomanguon"
                  value={form.telegramUrl}
                  onChange={(e) =>
                    setForm({ ...form, telegramUrl: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  🎵 TikTok
                </label>
                <Input
                  placeholder="https://tiktok.com/@khomanguon"
                  value={form.tiktokUrl}
                  onChange={(e) =>
                    setForm({ ...form, tiktokUrl: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Advanced */}
        {activeTab === "advanced" && (
          <div className="space-y-5 pt-2">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">Ghi chú</p>
              <p>
                Sau khi lưu, cấu hình mới sẽ tự động áp dụng cho tất cả người
                dùng trong vòng 15 giây (do cache). Nếu muốn thấy ngay, hãy
                reload lại trang (Ctrl+F5).
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="font-semibold text-slate-700 text-sm">
                Tổng quan cấu hình hiện tại
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    label: "Email TopBar",
                    ok: !!form.contactEmail,
                    value: form.contactEmail,
                  },
                  {
                    label: "SĐT TopBar",
                    ok: !!form.contactPhone,
                    value: form.contactPhone,
                  },
                  {
                    label: "Email Footer",
                    ok: !!form.footerEmail,
                    value: form.footerEmail,
                  },
                  {
                    label: "SĐT Footer",
                    ok: !!form.footerPhone,
                    value: form.footerPhone,
                  },
                  {
                    label: "Facebook",
                    ok: !!form.facebookUrl,
                    value: form.facebookUrl,
                  },
                  {
                    label: "YouTube",
                    ok: !!form.youtubeUrl,
                    value: form.youtubeUrl,
                  },
                  {
                    label: "Zalo",
                    ok: !!form.zaloUrl,
                    value: form.zaloUrl,
                  },
                  {
                    label: "Telegram",
                    ok: !!form.telegramUrl,
                    value: form.telegramUrl,
                  },
                  {
                    label: "Mô tả Footer",
                    ok: !!form.footerDescription,
                    value: form.footerDescription
                      ? form.footerDescription.substring(0, 40) + "..."
                      : "",
                  },
                  {
                    label: "Thông báo",
                    ok: form.announcementEnabled === "true",
                    value:
                      form.announcementEnabled === "true" ? "Đang bật" : "Tắt",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 text-sm ${
                      item.ok ? "text-green-700" : "text-slate-400"
                    }`}
                  >
                    {item.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-slate-400 ml-auto truncate max-w-[200px]">
                      {item.value || "Chưa cấu hình"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
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
    </div>
  );
}
