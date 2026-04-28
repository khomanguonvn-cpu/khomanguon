"use client";
export const runtime = 'edge';

import React, { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type SourceType = "db" | "env" | "default";

type OauthForm = {
  googleClientId: string;
  googleClientSecret: string;
  facebookClientId: string;
  facebookClientSecret: string;
};

type OauthSource = {
  googleClientId: SourceType;
  googleClientSecret: SourceType;
  facebookClientId: SourceType;
  facebookClientSecret: SourceType;
};

const defaultForm: OauthForm = {
  googleClientId: "",
  googleClientSecret: "",
  facebookClientId: "",
  facebookClientSecret: "",
};

const defaultSource: OauthSource = {
  googleClientId: "default",
  googleClientSecret: "default",
  facebookClientId: "default",
  facebookClientSecret: "default",
};

const sourceLabel: Record<SourceType, string> = {
  db: "Cơ sở dữ liệu",
  env: "Biến môi trường (.env)",
  default: "Mặc định hệ thống",
};

export default function AdminAuthPage() {
  const [form, setForm] = useState<OauthForm>(defaultForm);
  const [source, setSource] = useState<OauthSource>(defaultSource);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showFacebookSecret, setShowFacebookSecret] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/auth", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(String(json?.message || "Không thể tải cấu hình OAuth"));
        }

        if (json?.data && typeof json.data === "object") {
          setForm({
            ...defaultForm,
            ...json.data,
          });
        }

        if (json?.source && typeof json.source === "object") {
          setSource({
            ...defaultSource,
            ...json.source,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải cấu hình OAuth");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(String(json?.message || "Không thể lưu cấu hình OAuth"));
      }

      if (json?.data && typeof json.data === "object") {
        setForm({
          ...defaultForm,
          ...json.data,
        });
      }
      if (json?.source && typeof json.source === "object") {
        setSource({
          ...defaultSource,
          ...json.source,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu cấu hình OAuth");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Đăng nhập (OAuth)
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Skeleton className="h-4 w-64" />
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Cấu hình Đăng nhập (OAuth)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Thiết lập thông tin cho phép người dùng đăng nhập bằng tài khoản Google và Facebook.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* GOOGLE */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Đăng nhập bằng Google</h2>
            <div>
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Google Client ID</span>
                <span className="text-xs font-normal text-slate-400">
                  Đang dùng: {sourceLabel[source.googleClientId]}
                </span>
              </label>
              <Input
                value={form.googleClientId}
                onChange={(e) => setForm({ ...form, googleClientId: e.target.value })}
                placeholder="Ví dụ: 123456789-xxxx.apps.googleusercontent.com"
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Google Client Secret</span>
                <span className="text-xs font-normal text-slate-400">
                  Đang dùng: {sourceLabel[source.googleClientSecret]}
                </span>
              </label>
              <div className="relative">
                <Input
                  type={showGoogleSecret ? "text" : "password"}
                  value={form.googleClientSecret}
                  onChange={(e) => setForm({ ...form, googleClientSecret: e.target.value })}
                  placeholder="GOCSPX-xxxx"
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showGoogleSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* FACEBOOK */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Đăng nhập bằng Facebook</h2>
            <div>
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Facebook App ID</span>
                <span className="text-xs font-normal text-slate-400">
                  Đang dùng: {sourceLabel[source.facebookClientId]}
                </span>
              </label>
              <Input
                value={form.facebookClientId}
                onChange={(e) => setForm({ ...form, facebookClientId: e.target.value })}
                placeholder="Ví dụ: 101234567890"
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Facebook App Secret</span>
                <span className="text-xs font-normal text-slate-400">
                  Đang dùng: {sourceLabel[source.facebookClientSecret]}
                </span>
              </label>
              <div className="relative">
                <Input
                  type={showFacebookSecret ? "text" : "password"}
                  value={form.facebookClientSecret}
                  onChange={(e) => setForm({ ...form, facebookClientSecret: e.target.value })}
                  placeholder="xxxxxxx"
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowFacebookSecret(!showFacebookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showFacebookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang lưu...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <span>Lưu cấu hình</span>
              </div>
            )}
          </Button>

          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Đã lưu thành công
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
