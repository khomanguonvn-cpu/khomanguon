"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Smartphone,
  AlertTriangle,
  Bot,
  ShieldAlert,
  ImageIcon,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  EyeOff,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type VariantField = {
  key: string;
  label: string;
  type?: "text" | "number" | "select";
  required?: boolean;
  options?: Array<string | number>;
};

type Subcategory = {
  id: number;
  slug: string;
  name: string;
  variantSchema: VariantField[];
};

type Category = {
  id: number;
  slug: string;
  name: string;
  subcategories: Subcategory[];
};

type DeliveryMethod = "manual" | "digital" | "ai_account" | "source_code" | "service";
type SellerStatus = "active" | "draft" | "hidden";

type SellerVariant = {
  id: string;
  label: string;
  price: number;
  stock: number;
  attributes: Array<{ key: string; value: string | number | boolean }>;
};

type SellerAsset = {
  type: "image";
  url: string;
  label?: string;
};

type SellerAccountCredential = {
  id: string;
  accountType: string;
  username: string;
  password: string;
  note?: string;
};

type SellerSourceDownload = {
  id: string;
  label: string;
  url: string;
  passwordHint?: string;
  note?: string;
};

type SellerSecureDelivery = {
  accountCredentials: SellerAccountCredential[];
  sourceDownloads: SellerSourceDownload[];
};

type SellerProduct = {
  id: number;
  slug: string;
  name: string;
  categoryId: number;
  subcategoryId: number;
  description: string;
  deliveryMethod: DeliveryMethod;
  basePrice: number;
  stock: number;
  status: SellerStatus;
  variants: SellerVariant[];
  assets: SellerAsset[];
  secureDelivery: SellerSecureDelivery;
};

const LIMIT = 10;

const EMPTY_SECURE_DELIVERY: SellerSecureDelivery = {
  accountCredentials: [],
  sourceDownloads: [],
};

const DELIVERY_METHOD_OPTIONS: Array<{ value: DeliveryMethod; label: string; description: string }> = [
  {
    value: "digital",
    label: "Sản phẩm số",
    description: "Giao sản phẩm số thông thường (không chứa tài khoản hoặc link source riêng).",
  },
  {
    value: "ai_account",
    label: "Tài khoản AI",
    description: "Bắt buộc khai báo tài khoản bàn giao (loại tài khoản, username, password).",
  },
  {
    value: "source_code",
    label: "Mã nguồn",
    description: "Bắt buộc khai báo link tải source và mật khẩu giải nén nếu có.",
  },
  {
    value: "service",
    label: "Dịch vụ",
    description: "Bán dịch vụ theo mô tả, giao tay theo thông tin người mua.",
  },
  {
    value: "manual",
    label: "Thủ công",
    description: "Seller tự xử lý giao hàng thủ công sau khi đơn thanh toán.",
  },
];

const STATUS_OPTIONS: SellerStatus[] = ["active", "draft", "hidden"];

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeDeliveryMethod(value: unknown): DeliveryMethod {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "manual") return "manual";
  if (normalized === "digital") return "digital";
  if (normalized === "ai_account") return "ai_account";
  if (normalized === "source_code") return "source_code";
  if (normalized === "service") return "service";
  return "digital";
}

function normalizeStatus(value: unknown): SellerStatus {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "draft") return "draft";
  if (normalized === "hidden") return "hidden";
  return "active";
}

function normalizeAssets(input: unknown): SellerAsset[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<string>();
  const result: SellerAsset[] = [];

  for (const item of input) {
    const rawUrl = String((item as { url?: unknown })?.url || "").trim();
    if (!rawUrl || !isHttpUrl(rawUrl) || seen.has(rawUrl)) {
      continue;
    }

    seen.add(rawUrl);
    result.push({
      type: "image",
      url: rawUrl,
      label: String((item as { label?: unknown })?.label || "").trim(),
    });

    if (result.length >= 30) {
      break;
    }
  }

  return result;
}

function normalizeSecureDelivery(input: unknown): SellerSecureDelivery {
  const raw = (input || {}) as Partial<SellerSecureDelivery>;

  const accountCredentials = Array.isArray(raw.accountCredentials)
    ? raw.accountCredentials
        .map((item) => ({
          id: String(item?.id || createLocalId("acc")).trim(),
          accountType: String(item?.accountType || "").trim(),
          username: String(item?.username || "").trim(),
          password: String(item?.password || "").trim(),
          note: String(item?.note || "").trim(),
        }))
        .filter((item) => item.accountType && item.username && item.password)
        .slice(0, 500)
    : [];

  const sourceDownloads = Array.isArray(raw.sourceDownloads)
    ? raw.sourceDownloads
        .map((item) => ({
          id: String(item?.id || createLocalId("src")).trim(),
          label: String(item?.label || "").trim(),
          url: String(item?.url || "").trim(),
          passwordHint: String(item?.passwordHint || "").trim(),
          note: String(item?.note || "").trim(),
        }))
        .filter((item) => item.label && isHttpUrl(item.url))
        .slice(0, 500)
    : [];

  return {
    accountCredentials,
    sourceDownloads,
  };
}

function parseNumber(value: string | number, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return num;
}

export default function SellerProductsManager() {
  const [catalog, setCatalog] = useState<Category[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [listCategorySlug, setListCategorySlug] = useState("");
  const [listSubcategorySlug, setListSubcategorySlug] = useState("");
  const [listStatus, setListStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_desc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: LIMIT,
  });

  const [categorySlug, setCategorySlug] = useState("");
  const [subcategorySlug, setSubcategorySlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("digital");
  const [basePrice, setBasePrice] = useState(0);
  const [stock, setStock] = useState(1);

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageLabelInput, setImageLabelInput] = useState("");
  const [assets, setAssets] = useState<SellerAsset[]>([]);

  const [variantLabel, setVariantLabel] = useState("");
  const [variantPrice, setVariantPrice] = useState(0);
  const [variantStock, setVariantStock] = useState(1);
  const [variantAttrs, setVariantAttrs] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<SellerVariant[]>([]);

  const [secureDelivery, setSecureDelivery] = useState<SellerSecureDelivery>(EMPTY_SECURE_DELIVERY);

  // ── Telegram Bot check ──
  const [telegramConfigured, setTelegramConfigured] = useState<boolean | null>(null);

  const [accountTypeDraft, setAccountTypeDraft] = useState("");
  const [accountUsernameDraft, setAccountUsernameDraft] = useState("");
  const [accountPasswordDraft, setAccountPasswordDraft] = useState("");
  const [accountNoteDraft, setAccountNoteDraft] = useState("");

  const [sourceLabelDraft, setSourceLabelDraft] = useState("");
  const [sourceUrlDraft, setSourceUrlDraft] = useState("");
  const [sourcePasswordHintDraft, setSourcePasswordHintDraft] = useState("");
  const [sourceNoteDraft, setSourceNoteDraft] = useState("");

  const selectedCategory = useMemo(
    () => catalog.find((cat) => cat.slug === categorySlug),
    [catalog, categorySlug]
  );

  const selectedSubcategory = useMemo(
    () => selectedCategory?.subcategories.find((sub) => sub.slug === subcategorySlug),
    [selectedCategory, subcategorySlug]
  );

  const listSubcategoryOptions = useMemo(
    () => catalog.find((cat) => cat.slug === listCategorySlug)?.subcategories || [],
    [catalog, listCategorySlug]
  );

  const resetForm = useCallback(() => {
    setEditingId(null);
    setCategorySlug("");
    setSubcategorySlug("");
    setName("");
    setDescription("");
    setDeliveryMethod("digital");
    setBasePrice(0);
    setStock(1);
    setImageUrlInput("");
    setImageLabelInput("");
    setAssets([]);
    setVariantLabel("");
    setVariantPrice(0);
    setVariantStock(1);
    setVariantAttrs({});
    setVariants([]);
    setSecureDelivery(EMPTY_SECURE_DELIVERY);
    setAccountTypeDraft("");
    setAccountUsernameDraft("");
    setAccountPasswordDraft("");
    setAccountNoteDraft("");
    setSourceLabelDraft("");
    setSourceUrlDraft("");
    setSourcePasswordHintDraft("");
    setSourceNoteDraft("");
  }, []);

  const load = useCallback(
    async (opts?: {
      page?: number;
      search?: string;
      categorySlug?: string;
      subcategorySlug?: string;
      status?: string;
      sortBy?: string;
    }) => {
      setLoading(true);

      const nextPage = opts?.page ?? page;
      const nextSearch = opts?.search ?? search;
      const nextCategorySlug = opts?.categorySlug ?? listCategorySlug;
      const nextSubcategorySlug = opts?.subcategorySlug ?? listSubcategorySlug;
      const nextStatus = opts?.status ?? listStatus;
      const nextSortBy = opts?.sortBy ?? sortBy;

      try {
        const [catalogRes, productsRes] = await Promise.all([
          axios.get("/api/catalog"),
          axios.get("/api/seller/products", {
            params: {
              page: nextPage,
              limit: LIMIT,
              search: nextSearch,
              categorySlug: nextCategorySlug,
              subcategorySlug: nextSubcategorySlug,
              status: nextStatus,
              sortBy: nextSortBy,
            },
          }),
        ]);

        const catalogRows = Array.isArray(catalogRes.data?.data)
          ? (catalogRes.data.data as Category[])
          : [];

        const productRows = Array.isArray(productsRes.data?.data)
          ? (productsRes.data.data as Array<Record<string, unknown>>)
          : [];

        setCatalog(catalogRows);
        setProducts(
          productRows.map((item) => ({
            id: Number(item.id || 0),
            slug: String(item.slug || ""),
            name: String(item.name || ""),
            categoryId: Number(item.categoryId || 0),
            subcategoryId: Number(item.subcategoryId || 0),
            description: String(item.description || ""),
            deliveryMethod: normalizeDeliveryMethod(item.deliveryMethod),
            basePrice: Number(item.basePrice || 0),
            stock: Number(item.stock || 0),
            status: normalizeStatus(item.status),
            variants: Array.isArray(item.variants)
              ? (item.variants as SellerVariant[])
              : [],
            assets: normalizeAssets(item.assets),
            secureDelivery: normalizeSecureDelivery(item.secureDelivery),
          }))
        );

        setPagination(productsRes.data?.pagination || { page: 1, totalPages: 1, total: 0, limit: LIMIT });
        setPage(nextPage);
        setSearch(nextSearch);
        setListCategorySlug(nextCategorySlug);
        setListSubcategorySlug(nextSubcategorySlug);
        setListStatus(nextStatus);
        setSortBy(nextSortBy);
        setSelectedIds([]);
      } catch (error) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Không thể tải dữ liệu sản phẩm seller";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [listCategorySlug, listStatus, listSubcategorySlug, page, search, sortBy]
  );

  useEffect(() => {
    void load();
    // Check Telegram config
    axios.get("/api/seller/telegram")
      .then((res) => {
        setTelegramConfigured(!!res.data?.data?.isConfigured);
      })
      .catch(() => {
        setTelegramConfigured(false);
      });
  }, [load]);

  const addImageAsset = () => {
    const url = String(imageUrlInput || "").trim();
    const label = String(imageLabelInput || "").trim();

    if (!url) {
      toast.error("Vui lòng nhập URL ảnh");
      return;
    }

    if (!isHttpUrl(url)) {
      toast.error("URL ảnh phải bắt đầu bằng http:// hoặc https://");
      return;
    }

    setAssets((old) => {
      if (old.some((item) => item.url === url)) {
        toast.error("URL ảnh đã tồn tại trong danh sách");
        return old;
      }

      if (old.length >= 30) {
        toast.error("Tối đa 30 ảnh cho mỗi sản phẩm");
        return old;
      }

      return [...old, { type: "image", url, label }];
    });

    setImageUrlInput("");
    setImageLabelInput("");
  };

  const removeImageAsset = (url: string) => {
    setAssets((old) => old.filter((item) => item.url !== url));
  };

  const addVariant = () => {
    if (!variantLabel.trim()) {
      toast.error("Vui lòng nhập tên biến thể");
      return;
    }

    const schema = selectedSubcategory?.variantSchema || [];
    const missingField = schema.find((field) => {
      if (!field.required) {
        return false;
      }
      const rawValue = String(variantAttrs[field.key] || "").trim();
      return rawValue.length === 0;
    });

    if (missingField) {
      toast.error(`Thiếu thuộc tính bắt buộc: ${missingField.label || missingField.key}`);
      return;
    }

    const attributes = schema.map((field) => {
      const raw = String(variantAttrs[field.key] || "").trim();
      const value = field.type === "number" ? parseNumber(raw, 0) : raw;
      return {
        key: field.key,
        value,
      };
    });

    setVariants((old) => [
      ...old,
      {
        id: createLocalId("var"),
        label: variantLabel.trim(),
        price: Math.max(0, parseNumber(variantPrice, 0)),
        stock: Math.max(0, Math.round(parseNumber(variantStock, 0))),
        attributes,
      },
    ]);

    setVariantLabel("");
    setVariantPrice(0);
    setVariantStock(1);
    setVariantAttrs({});
  };

  const removeVariant = (id: string) => {
    setVariants((old) => old.filter((variant) => variant.id !== id));
  };

  const addAccountCredential = () => {
    const accountType = accountTypeDraft.trim();
    const username = accountUsernameDraft.trim();
    const password = accountPasswordDraft.trim();
    const note = accountNoteDraft.trim();

    if (!accountType || !username || !password) {
      toast.error("Thiếu thông tin tài khoản AI (loại, username, password)");
      return;
    }

    setSecureDelivery((old) => ({
      ...old,
      accountCredentials: [
        ...old.accountCredentials,
        {
          id: createLocalId("acc"),
          accountType,
          username,
          password,
          note,
        },
      ],
    }));

    setAccountTypeDraft("");
    setAccountUsernameDraft("");
    setAccountPasswordDraft("");
    setAccountNoteDraft("");
  };

  const removeAccountCredential = (id: string) => {
    setSecureDelivery((old) => ({
      ...old,
      accountCredentials: old.accountCredentials.filter((item) => item.id !== id),
    }));
  };

  const addSourceDownload = () => {
    const label = sourceLabelDraft.trim();
    const url = sourceUrlDraft.trim();
    const passwordHint = sourcePasswordHintDraft.trim();
    const note = sourceNoteDraft.trim();

    if (!label || !url) {
      toast.error("Thiếu thông tin link tải mã nguồn");
      return;
    }

    if (!isHttpUrl(url)) {
      toast.error("Link tải phải bắt đầu bằng http:// hoặc https://");
      return;
    }

    setSecureDelivery((old) => ({
      ...old,
      sourceDownloads: [
        ...old.sourceDownloads,
        {
          id: createLocalId("src"),
          label,
          url,
          passwordHint,
          note,
        },
      ],
    }));

    setSourceLabelDraft("");
    setSourceUrlDraft("");
    setSourcePasswordHintDraft("");
    setSourceNoteDraft("");
  };

  const removeSourceDownload = (id: string) => {
    setSecureDelivery((old) => ({
      ...old,
      sourceDownloads: old.sourceDownloads.filter((item) => item.id !== id),
    }));
  };

  const submit = async () => {
    if (!categorySlug || !subcategorySlug) {
      toast.error("Vui lòng chọn đầy đủ danh mục cha và danh mục con");
      return;
    }

    if (!name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }

    if (description.trim().length < 10) {
      toast.error("Mô tả sản phẩm phải từ 10 ký tự trở lên");
      return;
    }

    if (variants.length === 0) {
      toast.error("Cần ít nhất 1 biến thể");
      return;
    }

    if (assets.length === 0) {
      toast.error("Cần ít nhất 1 ảnh sản phẩm");
      return;
    }

    const payload = {
      categorySlug,
      subcategorySlug,
      name: name.trim(),
      description: description.trim(),
      deliveryMethod,
      stock: variants.reduce((sum, v) => sum + v.stock, 0),
      basePrice: variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : 0,
      variants,
      assets,
      secureDelivery,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await axios.patch(`/api/seller/products?id=${editingId}`, payload);
        toast.success("Đã cập nhật sản phẩm");
      } else {
        await axios.post("/api/seller/products", payload);
        toast.success("Đăng sản phẩm thành công");
      }

      resetForm();
      await load({
        page,
        search,
        categorySlug: listCategorySlug,
        subcategorySlug: listSubcategorySlug,
        status: listStatus,
        sortBy,
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể lưu sản phẩm";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: SellerProduct) => {
    const category = catalog.find((cat) => cat.id === item.categoryId);
    const subcategory = category?.subcategories.find((sub) => sub.id === item.subcategoryId);

    setEditingId(item.id);
    setCategorySlug(category?.slug || "");
    setSubcategorySlug(subcategory?.slug || "");
    setName(item.name || "");
    setDescription(item.description || "");
    setDeliveryMethod(normalizeDeliveryMethod(item.deliveryMethod));
    setBasePrice(Number(item.basePrice || 0));
    setStock(Number(item.stock || 0));
    setVariants(Array.isArray(item.variants) ? item.variants : []);
    setAssets(normalizeAssets(item.assets));
    setSecureDelivery(normalizeSecureDelivery(item.secureDelivery));
    setVariantAttrs({});

    setAccountTypeDraft("");
    setAccountUsernameDraft("");
    setAccountPasswordDraft("");
    setAccountNoteDraft("");
    setSourceLabelDraft("");
    setSourceUrlDraft("");
    setSourcePasswordHintDraft("");
    setSourceNoteDraft("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = async (id: number) => {
    try {
      await axios.delete(`/api/seller/products?id=${id}`);
      toast.success("Đã xóa sản phẩm");
      if (editingId === id) {
        resetForm();
      }
      await load({
        page,
        search,
        categorySlug: listCategorySlug,
        subcategorySlug: listSubcategorySlug,
        status: listStatus,
        sortBy,
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể xóa sản phẩm";
      toast.error(message);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((old) => (old.includes(id) ? old.filter((item) => item !== id) : [...old, id]));
  };

  const toggleSelectAllCurrentPage = () => {
    const currentIds = products.map((item) => item.id);
    const allSelected = currentIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((old) => old.filter((id) => !currentIds.includes(id)));
      return;
    }
    setSelectedIds((old) => Array.from(new Set([...old, ...currentIds])));
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để xóa");
      return;
    }

    try {
      await axios.delete("/api/seller/products", { data: { ids: selectedIds } });
      toast.success("Đã xóa các sản phẩm đã chọn");
      await load({
        page,
        search,
        categorySlug: listCategorySlug,
        subcategorySlug: listSubcategorySlug,
        status: listStatus,
        sortBy,
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể xóa nhiều sản phẩm";
      toast.error(message);
    }
  };

  const changeStatus = async (id: number, status: SellerStatus) => {
    try {
      await axios.patch(`/api/seller/products?id=${id}`, { status });
      toast.success("Đã cập nhật trạng thái");
      await load({
        page,
        search,
        categorySlug: listCategorySlug,
        subcategorySlug: listSubcategorySlug,
        status: listStatus,
        sortBy,
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể cập nhật trạng thái";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Cảnh báo Telegram Bot chưa kích hoạt ── */}
      {telegramConfigured === false && (
        <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-rose-50 p-5 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-200/50 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Yêu cầu thiết lập
              </span>
              <h3 className="mt-2 text-lg font-extrabold tracking-tight text-red-900 sm:text-xl">
                Bắt buộc kích hoạt Telegram Bot
              </h3>
              <p className="mt-2 text-sm text-red-700 sm:text-base">
                Bạn <strong>phải kích hoạt Telegram Bot</strong> trước khi đăng bán. Bot đảm bảo bạn
                nhận thông báo ngay khi có đơn để trả kịp thời. Nếu quá 24h chưa trả đơn, hệ thống
                sẽ tự động hoàn tiền cho người mua.
              </p>
              <Link
                href="/account/seller/telegram"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-200 transition-all hover:scale-[1.02] hover:shadow-lg sm:text-base"
              >
                <Bot className="h-5 w-5" />
                Kích hoạt Telegram Bot ngay
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md",
                editingId
                  ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200"
                  : "bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-emerald-200"
              )}
            >
              {editingId ? (
                <Pencil className="h-6 w-6 text-white" />
              ) : (
                <PackagePlus className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {editingId ? "Cập nhật sản phẩm" : "Đăng sản phẩm mới"}
              </h2>
              <p className="text-sm text-slate-500">
                Dữ liệu tài khoản AI / link source được mã hoá ở server — chỉ buyer đã thanh toán mới xem được.
              </p>
            </div>
          </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Danh mục cha</label>
            <select
              value={categorySlug}
              onChange={(event) => {
                setCategorySlug(event.target.value);
                setSubcategorySlug("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">Chọn danh mục cha</option>
              {catalog.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Danh mục con</label>
            <select
              value={subcategorySlug}
              onChange={(event) => setSubcategorySlug(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={!categorySlug}
            >
              <option value="">Chọn danh mục con</option>
              {(selectedCategory?.subcategories || []).map((subcategory) => (
                <option key={subcategory.id} value={subcategory.slug}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Loại bàn giao</label>
            <select
              value={deliveryMethod}
              onChange={(event) => setDeliveryMethod(normalizeDeliveryMethod(event.target.value))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {DELIVERY_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-snug text-slate-500">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-cyan-500" />
              {DELIVERY_METHOD_OPTIONS.find((item) => item.value === deliveryMethod)?.description}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Tên sản phẩm</label>
            <Input
              placeholder="VD: Source code Web bán hàng v1.0"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả sản phẩm</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 transition-colors hover:border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Mô tả rõ nội dung, quyền lợi, cách bàn giao, yêu cầu sử dụng..."
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Tối thiểu 10 ký tự · {description.trim().length} ký tự
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100">
                <ImageIcon className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ảnh sản phẩm</h3>
                <p className="text-xs text-slate-500">
                  Chỉ chấp nhận URL http/https · tối đa 30 ảnh
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                assets.length === 0
                  ? "bg-slate-200 text-slate-600"
                  : assets.length >= 30
                  ? "bg-amber-100 text-amber-700"
                  : "bg-cyan-100 text-cyan-700"
              )}
            >
              {assets.length} / 30
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-8">
            <div className="md:col-span-5">
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrlInput}
                onChange={(event) => setImageUrlInput(event.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                placeholder="Nhãn ảnh (tùy chọn)"
                value={imageLabelInput}
                onChange={(event) => setImageLabelInput(event.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              type="button"
              onClick={addImageAsset}
              className="h-11 rounded-xl bg-cyan-600 text-white shadow-sm hover:bg-cyan-700"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm
            </Button>
          </div>

          {imageUrlInput && isHttpUrl(imageUrlInput) && (
            <div className="mt-3 flex items-center gap-3 rounded-md border border-slate-200 p-3 bg-slate-50">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                <div className="absolute inset-0 skeleton animate-pulse" id="preview-skeleton" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrlInput}
                  alt="Xem trước"
                  className="w-full h-full object-cover object-center relative z-10"
                  style={{ opacity: 0 }}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.opacity = "1";
                    const skeletonEl = document.getElementById("preview-skeleton");
                    if (skeletonEl) skeletonEl.style.display = "none";
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const skeletonEl = document.getElementById("preview-skeleton");
                    if (skeletonEl) {
                      skeletonEl.innerHTML = '<div class="flex items-center justify-center w-full h-full text-xs text-red-400">Lỗi</div>';
                    }
                  }}
                />
              </div>
              <p className="text-sm text-slate-600 truncate flex-1">{imageUrlInput}</p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white py-8 text-sm text-slate-400">
                <ImageIcon className="h-8 w-8" />
                Chưa có ảnh sản phẩm nào
                <span className="text-[11px]">Dán URL ảnh ở trên và bấm “Thêm”</span>
              </div>
            ) : (
              assets.map((asset) => (
                <div key={asset.url} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 text-sm shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <div className="absolute inset-0 skeleton animate-pulse" id={`skeleton-${asset.url}`} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.label || "Ảnh sản phẩm"}
                        className="w-full h-full object-cover object-center relative z-10"
                        style={{ opacity: 0 }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.opacity = "1";
                          const skeletonEl = document.getElementById(`skeleton-${asset.url}`);
                          if (skeletonEl) skeletonEl.style.display = "none";
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const skeletonEl = document.getElementById(`skeleton-${asset.url}`);
                          if (skeletonEl) {
                            skeletonEl.className = "flex items-center justify-center w-full h-full text-xs text-red-400";
                            skeletonEl.innerHTML = "Lỗi";
                          }
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{asset.url}</p>
                      {asset.label && <p className="truncate text-xs text-slate-500">{asset.label}</p>}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImageAsset(asset.url)}
                    className="shrink-0 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                <Layers className="h-5 w-5 text-violet-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Biến thể sản phẩm</h3>
                <p className="text-xs text-slate-500">
                  Tối thiểu 1 biến thể · giá & tồn kho lấy theo biến thể
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                variants.length === 0 ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
              )}
            >
              <Tag className="h-3 w-3" />
              {variants.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Input
              placeholder="Tên biến thể (VD: Gói 1 tháng)"
              value={variantLabel}
              onChange={(event) => setVariantLabel(event.target.value)}
              className="h-11 rounded-xl"
            />
            <Input
              type="number"
              min={0}
              placeholder="Giá biến thể (đ)"
              value={variantPrice}
              onChange={(event) => setVariantPrice(parseNumber(event.target.value, 0))}
              className="h-11 rounded-xl"
            />
            <div className="relative">
              {variantStock >= 999999 ? (
                <div className="flex h-11 w-full items-center rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-20 text-sm font-medium text-slate-500">
                  Không giới hạn (∞)
                </div>
              ) : (
                <Input
                  type="number"
                  min={0}
                  placeholder="Tồn kho biến thể"
                  value={variantStock}
                  onChange={(event) => setVariantStock(Math.max(0, Math.round(parseNumber(event.target.value, 0))))}
                  className="h-11 rounded-xl pr-20"
                />
              )}
              <button
                type="button"
                onClick={() => setVariantStock(variantStock >= 999999 ? 1 : 999999)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800"
              >
                {variantStock >= 999999 ? "Nhập số" : "Vô hạn"}
              </button>
            </div>
          </div>

          {(selectedSubcategory?.variantSchema || []).length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {selectedSubcategory?.variantSchema.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={variantAttrs[field.key] || ""}
                      onChange={(event) =>
                        setVariantAttrs((old) => ({
                          ...old,
                          [field.key]: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-md border border-slate-300 px-3"
                    >
                      <option value="">Chọn giá trị</option>
                      {(field.options || []).map((option) => (
                        <option key={String(option)} value={String(option)}>
                          {String(option)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      value={variantAttrs[field.key] || ""}
                      onChange={(event) =>
                        setVariantAttrs((old) => ({
                          ...old,
                          [field.key]: event.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3">
            <Button
              type="button"
              onClick={addVariant}
              className="h-11 rounded-xl bg-violet-600 text-white shadow-sm hover:bg-violet-700"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm biến thể
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {variants.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 bg-white py-8 text-sm text-slate-400">
                <Layers className="h-7 w-7" />
                Chưa có biến thể nào
                <span className="text-[11px]">Thêm ít nhất 1 biến thể để buyer có thể mua</span>
              </div>
            ) : (
              variants.map((variant) => (
                <div key={variant.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">{variant.label}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                          {variant.price.toLocaleString("vi-VN")}đ
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                          Tồn: {variant.stock >= 999999 ? "∞ (Không giới hạn)" : variant.stock}
                        </span>
                      </div>
                      {variant.attributes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                          {variant.attributes.map((attr, index) => (
                            <span
                              key={`${variant.id}-${attr.key}-${index}`}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600"
                            >
                              <span className="font-semibold text-slate-700">{attr.key}:</span> {String(attr.value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variant.id)}
                      className="shrink-0 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {(deliveryMethod === "ai_account" || deliveryMethod === "source_code") && (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-200">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-blue-900">Cách bàn giao đơn</h3>
                <p className="mt-1 text-sm text-blue-800">
                  <strong>Bạn không nhập tài khoản/mật khẩu ở đây.</strong> Khi có đơn mới, hệ thống gửi
                  thông báo Telegram Bot — bạn vào mục “Đơn cần trả” và nhập thông tin bàn giao cho
                  từng đơn.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Quá 24h: tự hoàn tiền
                  </span>
                  <Link
                    href="/account/seller/telegram"
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                  >
                    <Bot className="h-3.5 w-3.5" />
                    Cấu hình Telegram Bot
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="h-12 rounded-xl px-6 font-bold"
            >
              <X className="mr-1.5 h-5 w-5" />
              Hủy sửa
            </Button>
          )}
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || loading}
            className={cn(
              "h-12 rounded-xl px-8 font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg",
              editingId
                ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200 hover:from-amber-600 hover:to-orange-600"
                : "bg-gradient-to-br from-cyan-600 to-emerald-600 shadow-emerald-200 hover:from-cyan-700 hover:to-emerald-700"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang lưu...
              </>
            ) : editingId ? (
              <>
                <Save className="mr-2 h-5 w-5" />
                Lưu cập nhật
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Đăng sản phẩm ngay
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-md">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Sản phẩm đã đăng
              </h3>
              <p className="text-sm text-slate-500">
                {pagination.total} sản phẩm · quản lý trạng thái, chỉnh sửa, xoá nhanh
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tên sản phẩm..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          <select
            value={listCategorySlug}
            onChange={(event) => {
              setListCategorySlug(event.target.value);
              setListSubcategorySlug("");
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 md:col-span-2"
          >
            <option value="">Tất cả danh mục cha</option>
            {catalog.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={listSubcategorySlug}
            onChange={(event) => setListSubcategorySlug(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 md:col-span-2"
            disabled={!listCategorySlug}
          >
            <option value="">Tất cả danh mục con</option>
            {listSubcategoryOptions.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.slug}>
                {subcategory.name}
              </option>
            ))}
          </select>

          <select
            value={listStatus}
            onChange={(event) => setListStatus(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 md:col-span-2"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="draft">Bản nháp</option>
            <option value="hidden">Đã ẩn</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 md:col-span-2"
          >
            <option value="created_desc">Mới nhất</option>
            <option value="created_asc">Cũ nhất</option>
            <option value="name_asc">Tên A-Z</option>
            <option value="name_desc">Tên Z-A</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>

          <Button
            type="button"
            onClick={() =>
              load({
                page: 1,
                search,
                categorySlug: listCategorySlug,
                subcategorySlug: listSubcategorySlug,
                status: listStatus,
                sortBy,
              })
            }
            className="h-11 rounded-xl bg-slate-900 text-white shadow-sm hover:bg-slate-800"
          >
            <Search className="mr-1.5 h-4 w-4" />
            Lọc
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={toggleSelectAllCurrentPage}
            className="rounded-xl"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Chọn trang hiện tại
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={bulkDelete}
            disabled={selectedIds.length === 0}
            className={cn(
              "rounded-xl",
              selectedIds.length > 0 && "border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            )}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Xoá đã chọn ({selectedIds.length})
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 py-12 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-white via-slate-50 to-cyan-50/40 py-14 text-center shadow-sm">
              <div className="relative">
                <div className="absolute inset-0 -m-3 rounded-full bg-cyan-100/60 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-md">
                  <Package className="h-10 w-10 text-cyan-400" />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-800 sm:text-xl">Chưa có sản phẩm nào</p>
              <p className="max-w-sm text-sm text-slate-500">
                Tạo sản phẩm đầu tiên ở form phía trên — chọn danh mục, viết mô tả, đăng ngay!
              </p>
            </div>
          ) : (
            products.map((item) => {
              const firstAsset = item.assets[0];
              const statusInfo =
                item.status === "active"
                  ? { label: "Hoạt động", icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50" }
                  : item.status === "draft"
                  ? { label: "Bản nháp", icon: Pencil, color: "text-amber-700", bg: "bg-amber-50" }
                  : { label: "Đã ẩn", icon: EyeOff, color: "text-slate-700", bg: "bg-slate-100" };
              const StatusIcon = statusInfo.icon;
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border bg-white p-4 text-sm shadow-sm transition-all hover:shadow-md",
                    isSelected ? "border-cyan-400 ring-2 ring-cyan-200" : "border-slate-200"
                  )}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="mt-2 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />

                    {/* Thumbnail */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {firstAsset ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstAsset.url}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ImageIcon className="h-7 w-7" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2">
                        <p className="min-w-0 flex-1 truncate text-base font-bold text-slate-900">
                          {item.name}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                            statusInfo.bg,
                            statusInfo.color
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">/{item.slug}</p>
                      <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{item.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                          {Number(item.basePrice || 0).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                          Tồn: {item.stock >= 999999 ? "∞ (Không giới hạn)" : item.stock}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-700">
                          <Tag className="h-2.5 w-2.5" />
                          {item.variants.length} biến thể
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 font-semibold text-cyan-700">
                          <ImageIcon className="h-2.5 w-2.5" />
                          {item.assets.length} ảnh
                        </span>
                        <span className="text-slate-500">Loại: {item.deliveryMethod}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={item.status}
                        onChange={(event) => changeStatus(item.id, normalizeStatus(event.target.value))}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status === "active" ? "Hoạt động" : status === "draft" ? "Bản nháp" : "Đã ẩn"}
                          </option>
                        ))}
                      </select>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(item)}
                        className="rounded-lg"
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(item.id)}
                        className="rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <p>
              Trang <strong className="text-slate-900">{pagination.page}</strong> / {pagination.totalPages} · Tổng{" "}
              <strong className="text-slate-900">{pagination.total}</strong> sản phẩm
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() =>
                  load({
                    page: pagination.page - 1,
                    search,
                    categorySlug: listCategorySlug,
                    subcategorySlug: listSubcategorySlug,
                    status: listStatus,
                    sortBy,
                  })
                }
                className="rounded-xl"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  load({
                    page: pagination.page + 1,
                    search,
                    categorySlug: listCategorySlug,
                    subcategorySlug: listSubcategorySlug,
                    status: listStatus,
                    sortBy,
                  })
                }
                className="rounded-xl"
              >
                Sau
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
