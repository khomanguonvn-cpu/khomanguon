export const runtime = 'edge';

"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type SourceType = "db" | "env" | "default";

type PayOSForm = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  apiEndpoint: string;
};

type PayOSSource = {
  clientId: SourceType;
  apiKey: SourceType;
  checksumKey: SourceType;
  apiEndpoint: SourceType;
};

const defaultForm: PayOSForm = {
  clientId: "",
  apiKey: "",
  checksumKey: "",
  apiEndpoint: "https://api-merchant.payos.vn/v2/payment-requests",
};

const defaultSource: PayOSSource = {
  clientId: "default",
  apiKey: "default",
  checksumKey: "default",
  apiEndpoint: "default",
};

const sourceLabel: Record<SourceType, string> = {
  db: "Cơ sở dữ liệu",
  env: "Biến môi trường (.env)",
  default: "Mặc định hệ thống",
};

export default function AdminPayOSPage() {
  const [form, setForm] = useState<PayOSForm>(defaultForm);
  const [source, setSource] = useState<PayOSSource>(defaultSource);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChecksumKey, setShowChecksumKey] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/payos", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(String(json?.message || "Không thể tải cấu hình PayOS"));
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
        setError(err instanceof Error ? err.message : "Không thể tải cấu hình PayOS");
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
      const res = await fetch("/api/admin/payos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(String(json?.message || "Không thể lưu cấu hình PayOS"));
      }

      if (json?.source && typeof json.source === "object") {
        setSource({
          ...defaultSource,
          ...json.source,
        });
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu cấu hình PayOS");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Cấu hình PayOS
        </h3>

        <p className="text-sm text-slate-500">
          Quản trị viên có thể cấu hình key PayOS trực tiếp tại đây. Hệ thống sẽ ưu tiên key trong
          Database, sau đó mới fallback sang biến môi trường.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Client ID</label>
            <Input
              placeholder="Nhập PAYOS_CLIENT_ID"
              value={form.clientId}
              onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
            />
            <p className="text-xs text-slate-500 mt-1">Nguồn hiện tại: {sourceLabel[source.clientId]}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">API Key</label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="Nhập PAYOS_API_KEY"
                value={form.apiKey}
                onChange={(event) => setForm((prev) => ({ ...prev, apiKey: event.target.value }))}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApiKey((prev) => !prev)}
                className="px-3"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Nguồn hiện tại: {sourceLabel[source.apiKey]}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Checksum Key</label>
            <div className="flex gap-2">
              <Input
                type={showChecksumKey ? "text" : "password"}
                placeholder="Nhập PAYOS_CHECKSUM_KEY"
                value={form.checksumKey}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, checksumKey: event.target.value }))
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowChecksumKey((prev) => !prev)}
                className="px-3"
              >
                {showChecksumKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nguồn hiện tại: {sourceLabel[source.checksumKey]}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">API Endpoint</label>
            <Input
              placeholder="https://api-merchant.payos.vn/v2/payment-requests"
              value={form.apiEndpoint}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, apiEndpoint: event.target.value }))
              }
            />
            <p className="text-xs text-slate-500 mt-1">
              Nguồn hiện tại: {sourceLabel[source.apiEndpoint]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-1">
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu cấu hình PayOS"}
          </Button>
          {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Đã lưu cấu hình thành công</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}

