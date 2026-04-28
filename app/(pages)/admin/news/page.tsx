"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import Toast from "@/components/modules/custom/Toast";

type NewsItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  sourceUrl: string;
  originalTitle: string;
  keywords: string[];
  tags: string[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

type NewsFormState = {
  id: number | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  sourceUrl: string;
  originalTitle: string;
  keywords: string;
  tags: string;
  status: "draft" | "published";
  aiPrompt: string;
};

type NewsAiProvider = "openrouter" | "groq" | "mistral";

type NewsAiConfig = {
  provider: NewsAiProvider;
  model: string;
  groqApiKey: string;
  openrouterApiKey: string;
  mistralApiKey: string;
};

const AI_MODEL_OPTIONS: Record<NewsAiProvider, string[]> = {
  openrouter: [
    "openai/gpt-4o-mini",
    "openai/gpt-4.1-mini",
    "google/gemini-2.5-flash-preview",
    "anthropic/claude-3.5-sonnet",
    "meta-llama/llama-3.3-70b-instruct",
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ],
  mistral: [
    "mistral-nemo",
    "mistral-small",
    "mistral-medium",
    "mistral-large",
    "mistral-small-latest",
    "mistral-large-latest",
    "open-mistral-7b",
    "open-mixtral-8x7b",
    "open-mixtral-8x22b",
    "mistral-embed",
  ],
};

const defaultPrompt = `
Bạn là biên tập viên SEO tiếng Việt cho website thương mại điện tử.

Mục tiêu:
1) Viết lại tiêu đề và nội dung để dễ index, rõ nghĩa, tự nhiên, không nhồi nhét từ khóa.
2) Giữ đúng ý chính của bài gốc, không bịa dữ kiện, không thêm thông tin không có trong bài.
3) Tạo phiên bản thân thiện với Google: độc đáo, dễ đọc, cấu trúc rõ ràng, không spam.

Yêu cầu đầu ra dạng JSON hợp lệ với đúng các key:
- title: string (50-70 ký tự, có từ khóa chính, tự nhiên)
- excerpt: string (140-180 ký tự, tóm tắt hấp dẫn)
- content: string (nội dung viết lại hoàn chỉnh, chia đoạn rõ ràng, có các tiêu đề phụ khi cần)
- keywords: string[] (8-12 từ khóa liên quan trực tiếp nội dung)
- tags: string[] (4-8 tag ngắn gọn, sát chủ đề)

Quy tắc liên kết và hình ảnh:
- Giữ nguyên toàn bộ link ảnh của bài gốc.
- Xóa mọi link không phải ảnh khỏi bài viết.

Quy tắc chất lượng:
- Không dùng thủ thuật SEO mũ đen.
- Không lặp từ khóa quá mức.
- Ưu tiên trải nghiệm người đọc.
- Giữ văn phong chuyên nghiệp, rõ ràng, đáng tin cậy.
`.trim();

const emptyForm: NewsFormState = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  sourceUrl: "",
  originalTitle: "",
  keywords: "",
  tags: "",
  status: "draft",
  aiPrompt: defaultPrompt,
};

const defaultAiConfig: NewsAiConfig = {
  provider: "openrouter",
  model: AI_MODEL_OPTIONS.openrouter[0],
  groqApiKey: "",
  openrouterApiKey: "",
  mistralApiKey: "",
};

function toLocaleDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("vi-VN");
}

function extractImageUrlsFromContent(content: string) {
  const found = String(content || "").match(/https?:\/\/[^\s<>"'`)\]]+/gi) || [];
  const urls: string[] = [];
  const seen = new Set<string>();
  const pattern = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?|#|$)/i;

  for (const raw of found) {
    const cleaned = raw.trim().replace(/[),.;!?]+$/, "");
    if (!pattern.test(cleaned)) {
      continue;
    }
    if (seen.has(cleaned)) {
      continue;
    }
    seen.add(cleaned);
    urls.push(cleaned);
  }

  return urls;
}

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [loadingAiConfig, setLoadingAiConfig] = useState(false);
  const [savingAiConfig, setSavingAiConfig] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "draft" | "published">("");
  const [form, setForm] = useState<NewsFormState>(emptyForm);
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawledImageUrls, setCrawledImageUrls] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [aiConfig, setAiConfig] = useState<NewsAiConfig>(defaultAiConfig);

  const activeModeLabel = useMemo(() => {
    return form.id ? "Sửa bài tin tức" : "Tạo bài tin tức";
  }, [form.id]);

  const modelOptions = useMemo(() => {
    const base = AI_MODEL_OPTIONS[aiConfig.provider];
    const currentModel = aiConfig.model.trim();
    if (!currentModel || base.includes(currentModel)) {
      return base;
    }
    return [currentModel, ...base];
  }, [aiConfig.provider, aiConfig.model]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search.trim()) {
        query.set("search", search.trim());
      }
      if (statusFilter) {
        query.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/news?${query.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể tải danh sách tin tức"));
      }

      setItems((json?.data || []) as NewsItem[]);
      setTotalPages(Number(json?.pagination?.totalPages || 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách tin tức");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchAiConfig = useCallback(async () => {
    setLoadingAiConfig(true);
    try {
      const response = await fetch("/api/admin/news/ai-config", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể tải cấu hình AI"));
      }
      const data = (json?.data || {}) as Partial<NewsAiConfig>;
      const prov = data.provider === "groq" ? "groq" : data.provider === "mistral" ? "mistral" : "openrouter";
      const defaultModels = AI_MODEL_OPTIONS[prov] || AI_MODEL_OPTIONS.openrouter;
      setAiConfig({
        provider: prov,
        model: String(data.model || "").trim() || defaultModels[0],
        groqApiKey: String(data.groqApiKey || "").trim(),
        openrouterApiKey: String(data.openrouterApiKey || "").trim(),
        mistralApiKey: String(data.mistralApiKey || "").trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải cấu hình AI");
    } finally {
      setLoadingAiConfig(false);
    }
  }, []);

  useEffect(() => {
    void fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    void fetchAiConfig();
  }, [fetchAiConfig]);

  const resetForm = () => {
    setForm(emptyForm);
    setCrawlUrl("");
    setCrawledImageUrls([]);
    setNotice("");
    setError("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: NewsItem) => {
    setForm({
      id: item.id,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      content: item.content,
      coverImage: item.coverImage || "",
      sourceUrl: item.sourceUrl || "",
      originalTitle: item.originalTitle || "",
      keywords: (item.keywords || []).join(", "),
      tags: (item.tags || []).join(", "),
      status: item.status === "published" ? "published" : "draft",
      aiPrompt: defaultPrompt,
    });
    setCrawlUrl(item.sourceUrl || "");
    setCrawledImageUrls(extractImageUrlsFromContent(item.content || ""));
    setNotice("");
    setError("");
    setShowForm(true);
  };

  const saveAiConfig = useCallback(
    async (silent = false) => {
      const model = aiConfig.model.trim();
      if (!model) {
        setError("Vui lòng chọn model AI");
        return null;
      }

      setSavingAiConfig(true);
      if (!silent) {
        setNotice("");
        setError("");
      }

      try {
        const response = await fetch("/api/admin/news/ai-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: aiConfig.provider,
            model,
            groqApiKey: aiConfig.groqApiKey,
            openrouterApiKey: aiConfig.openrouterApiKey,
            mistralApiKey: aiConfig.mistralApiKey,
          }),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(String(json?.message || "Không thể lưu cấu hình AI"));
        }

        const data = (json?.data || {}) as Partial<NewsAiConfig>;
        const prov = data.provider === "groq" ? "groq" : data.provider === "mistral" ? "mistral" : "openrouter";
        const savedConfig: NewsAiConfig = {
          provider: prov,
          model: String(data.model || model).trim(),
          groqApiKey: String(data.groqApiKey || "").trim(),
          openrouterApiKey: String(data.openrouterApiKey || "").trim(),
          mistralApiKey: String(data.mistralApiKey || "").trim(),
        };
        setAiConfig(savedConfig);
        if (!silent) {
          setNotice("Đã lưu cấu hình AI cho module tin tức");
        }
        return savedConfig;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể lưu cấu hình AI");
        return null;
      } finally {
        setSavingAiConfig(false);
      }
    },
    [aiConfig]
  );

  const handleSave = async () => {
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const endpoint = "/api/admin/news";
      const method = form.id ? "PATCH" : "POST";
      const payload: Record<string, unknown> = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage,
        sourceUrl: form.sourceUrl,
        originalTitle: form.originalTitle,
        keywords: form.keywords,
        tags: form.tags,
        status: form.status,
      };

      if (form.id) {
        payload.id = form.id;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể lưu bài viết"));
      }

      const saved = json?.data as NewsItem | undefined;
      if (saved) {
        setForm((prev) => ({
          ...prev,
          id: saved.id,
          slug: saved.slug,
          keywords: (saved.keywords || []).join(", "),
          tags: (saved.tags || []).join(", "),
        }));
      }

      setNotice(String(json?.message || "Đã lưu bài viết thành công"));
      await fetchNews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu bài viết");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    setNotice("");

    // Use a toast-based confirmation instead of window.confirm
    const confirmed = await new Promise<boolean>((resolve) => {
      toast.custom(
        (t) => (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 max-w-sm w-full animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Xác nhận xóa bài viết</p>
                <p className="text-sm text-slate-500 mt-1">Bạn chắc chắn muốn xóa? Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { toast.dismiss(t.id); resolve(false); }}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { toast.dismiss(t.id); resolve(true); }}
              >
                Xóa bài viết
              </Button>
            </div>
          </div>
        ),
        { duration: 15000, position: "top-center" }
      );
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/news?id=${id}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể xóa bài viết"));
      }

      if (form.id === id) {
        resetForm();
      }

      toast.custom((t) => (
        <Toast status="success" message="Đã xóa bài viết thành công" toastId={t.id} />
      ));
      await fetchNews();
    } catch (err) {
      toast.custom((t) => (
        <Toast status="error" message={err instanceof Error ? err.message : "Không thể xóa bài viết"} toastId={t.id} />
      ));
    }
  };

  const handleCrawl = async () => {
    const url = String(crawlUrl || form.sourceUrl || "").trim();
    if (!url) {
      setError("Vui lòng nhập URL nguồn để cào bài");
      return;
    }

    setCrawling(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/news/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể cào bài viết"));
      }

      const data = json?.data || {};
      const imageUrls = Array.isArray(data.imageUrls)
        ? data.imageUrls.map((item: unknown) => String(item || "").trim()).filter(Boolean)
        : extractImageUrlsFromContent(String(data.content || ""));

      setForm((prev) => ({
        ...prev,
        title: String(data.title || prev.title || ""),
        originalTitle: String(data.title || prev.originalTitle || ""),
        excerpt: String(data.excerpt || prev.excerpt || ""),
        content: String(data.content || prev.content || ""),
        coverImage: String(data.coverImage || prev.coverImage || ""),
        sourceUrl: String(data.sourceUrl || prev.sourceUrl || url),
        keywords: Array.isArray(data.keywords) ? data.keywords.join(", ") : prev.keywords,
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : prev.tags,
      }));
      setCrawlUrl(url);
      setCrawledImageUrls(imageUrls);
      setNotice(
        imageUrls.length > 0
          ? `Đã cào bài và tự điền form (${imageUrls.length} link ảnh đã lấy).`
          : "Đã cào bài và tự điền form."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cào bài viết");
    } finally {
      setCrawling(false);
    }
  };

  const handleRewrite = async () => {
    if (!form.title.trim() && !form.content.trim()) {
      setError("Cần có tiêu đề hoặc nội dung trước khi viết lại bằng AI");
      return;
    }

    setRewriting(true);
    setError("");
    setNotice("");

    try {
      const savedConfig = await saveAiConfig(true);
      if (!savedConfig) {
        return;
      }

      const response = await fetch("/api/admin/news/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          sourceUrl: form.sourceUrl,
          customPrompt: form.aiPrompt,
          imageUrls: crawledImageUrls,
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(String(json?.message || "Không thể viết lại bài bằng AI"));
      }

      const data = json?.data || {};
      const nextContent = String(data.content || form.content || "");
      const imageUrls = Array.isArray(data.imageUrls)
        ? data.imageUrls.map((item: unknown) => String(item || "").trim()).filter(Boolean)
        : extractImageUrlsFromContent(nextContent);

      setForm((prev) => ({
        ...prev,
        title: String(data.title || prev.title || ""),
        excerpt: String(data.excerpt || prev.excerpt || ""),
        content: nextContent,
        keywords: Array.isArray(data.keywords) ? data.keywords.join(", ") : prev.keywords,
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : prev.tags,
      }));
      setCrawledImageUrls(imageUrls);

      const warning = String(data?.warning || "").trim();
      if (warning) {
        setNotice(warning);
      } else {
        const provider = String(data.provider || savedConfig.provider).toUpperCase();
        const model = String(data.model || savedConfig.model).trim();
        setNotice(
          `Đã viết lại bài bằng ${provider}${model ? ` / ${model}` : ""}. Link thường đã được xóa, chỉ giữ link ảnh.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể viết lại bài bằng AI");
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Quản lý tin tức
            </h2>
            <p className="text-sm text-slate-500">
              Tin tức chỉ hiển thị tại menu Tin tức, không tự động hiện ở trang chủ.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-1">
            <Plus className="h-4 w-4" />
            Tạo bài mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 border border-slate-200 rounded-xl px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Tìm theo tiêu đề..."
              className="h-10 flex-1 outline-none text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value as "" | "draft" | "published");
            }}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="published">Đã xuất bản</option>
          </select>
          <Button variant="outline" onClick={fetchNews} className="h-10 gap-1">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {(showForm || form.id !== null) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">{activeModeLabel}</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={resetForm}>
                Xóa form
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Đang lưu..." : "Lưu bài viết"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-3">
            <p className="text-sm font-semibold text-slate-800">
              Cào bài viết và AI viết lại chuẩn SEO
            </p>

            <div className="flex flex-col md:flex-row gap-2">
              <Input
                placeholder="Dán URL bài viết nguồn để cào..."
                value={crawlUrl}
                onChange={(event) => setCrawlUrl(event.target.value)}
              />
              <Button onClick={handleCrawl} disabled={crawling} variant="outline" className="gap-1">
                {crawling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {crawling ? "Đang cào..." : "Cào bài viết"}
              </Button>
              <Button onClick={handleRewrite} disabled={rewriting} className="gap-1">
                {rewriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {rewriting ? "AI đang xử lý..." : "AI viết lại"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Loại AI</label>
                <select
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm w-full bg-white"
                  value={aiConfig.provider}
                  onChange={(event) => {
                    const nextProvider = event.target.value as NewsAiProvider;
                    setAiConfig((prev) => ({
                      ...prev,
                      provider: nextProvider,
                      model:
                        AI_MODEL_OPTIONS[nextProvider].includes(prev.model)
                          ? prev.model
                          : AI_MODEL_OPTIONS[nextProvider][0],
                    }));
                  }}
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="groq">Groq</option>
                  <option value="mistral">Mistral AI</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Model viết bài</label>
                <select
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm w-full bg-white"
                  value={aiConfig.model}
                  onChange={(event) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      model: event.target.value,
                    }))
                  }
                >
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Cấu hình AI</label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 gap-1"
                  onClick={() => void saveAiConfig(false)}
                  disabled={savingAiConfig || loadingAiConfig}
                >
                  {savingAiConfig ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingAiConfig ? "Đang lưu..." : "Lưu cấu hình AI"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Groq API key</label>
                <Input
                  type="password"
                  placeholder="Nhập Groq API key..."
                  value={aiConfig.groqApiKey}
                  onChange={(event) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      groqApiKey: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">OpenRouter API key</label>
                <Input
                  type="password"
                  placeholder="Nhập OpenRouter API key..."
                  value={aiConfig.openrouterApiKey}
                  onChange={(event) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      openrouterApiKey: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Mistral API key</label>
                <Input
                  type="password"
                  placeholder="Nhập Mistral API key..."
                  value={aiConfig.mistralApiKey}
                  onChange={(event) =>
                    setAiConfig((prev) => ({
                      ...prev,
                      mistralApiKey: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <textarea
              className="w-full min-h-[140px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              placeholder="Prompt chuẩn để AI viết lại bài..."
              value={form.aiPrompt}
              onChange={(event) => setForm((prev) => ({ ...prev, aiPrompt: event.target.value }))}
            />

            <p className="text-xs text-slate-500">
              {loadingAiConfig
                ? "Đang tải cấu hình AI..."
                : `Đang dùng: ${aiConfig.provider.toUpperCase()} / ${aiConfig.model}`}
            </p>
            {crawledImageUrls.length > 0 && (
              <p className="text-xs text-slate-500">
                Đã lưu {crawledImageUrls.length} link ảnh để giữ lại sau khi AI viết lại.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              className="md:col-span-2"
              placeholder="Tiêu đề bài viết"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <Input
              placeholder="Slug (để trống sẽ tự sinh)"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
            />
            <select
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value as "draft" | "published" }))
              }
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Xuất bản</option>
            </select>
            <Input
              className="md:col-span-2"
              placeholder="URL nguồn bài viết (nếu có)"
              value={form.sourceUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
            />
            <Input
              className="md:col-span-2"
              placeholder="URL ảnh đại diện"
              value={form.coverImage}
              onChange={(event) => setForm((prev) => ({ ...prev, coverImage: event.target.value }))}
            />
            <Input
              className="md:col-span-2"
              placeholder="Từ khóa SEO (cách nhau dấu phẩy)"
              value={form.keywords}
              onChange={(event) => setForm((prev) => ({ ...prev, keywords: event.target.value }))}
            />
            <Input
              className="md:col-span-2"
              placeholder="Tag (cách nhau dấu phẩy)"
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Mô tả ngắn</label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Mô tả ngắn cho danh sách tin tức..."
              value={form.excerpt}
              onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Nội dung bài viết</label>
            <textarea
              className="w-full min-h-[260px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nhập nội dung bài viết..."
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            />
          </div>

          {notice && <p className="text-sm text-green-600">{notice}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Tiêu đề</th>
                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold">Cập nhật</th>
                <th className="px-4 py-3 text-center font-semibold">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={5} className="px-4 py-3">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Chưa có bài viết tin tức nào
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs font-mono">#{item.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1">/{item.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          item.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status === "published" ? "Xuất bản" : "Bản nháp"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {toLocaleDate(item.updatedAt || item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Trang {page}/{totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
