"use client";
export const runtime = 'edge';
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { Search, Plus, Eye, Edit, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ProductVariantOption = {
  variantId: string;
  option: string;
  images: string[];
  price: number;
  qty: number;
  sold: number;
  discount: number;
  attributes: Array<{ key: string; value: string | number | boolean }>;
};

type ProductSubProduct = {
  sku: string;
  style: { name: string; color: string; image: string };
  options: ProductVariantOption[];
};

type ProductCategory = {
  _id: string;
  name: string;
  link: string;
  slug: string;
  image: string;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  featured: boolean;
  category: ProductCategory;
  subProducts: ProductSubProduct[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("/api/products");
        setProducts(response.data?.data || []);
      } catch {
        toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (productId: number) => {
    setDeletingId(productId);
    try {
      const res = await axios.delete(`/api/admin/products?id=${productId}`);
      if (res.data?.success) {
        setProducts((prev) => prev.filter((p) => Number(p._id) !== productId));
      }
    } catch {
      toast.error("Không thể xóa sản phẩm");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 border border-slate-200 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25">
          <Plus className="h-4 w-4" />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Sản phẩm</th>
                <th className="px-4 py-3 text-left font-semibold">Danh mục</th>
                <th className="px-4 py-3 text-left font-semibold">Giá</th>
                <th className="px-4 py-3 text-left font-semibold">Nổi bật</th>
                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    Chưa có sản phẩm nào
                  </td>
                </tr>
              ) : (
                filtered.map((product, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {product.subProducts?.[0]?.options?.[0]?.images?.[0] ? (
                            <Image
                              src={product.subProducts[0].options[0].images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              width={40}
                              height={40}
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Không ảnh</div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm line-clamp-1">{product.name}</p>
                          <p className="text-xs text-slate-400">#{product._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{product.category?.name || "—"}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(
                        product.subProducts?.[0]?.options?.[0]?.price || 0
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {product.featured ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                          <ToggleRight className="h-3.5 w-3.5" /> Nổi bật
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <ToggleLeft className="h-3.5 w-3.5" /> Thường
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`/products/${product.slug}`}
                          className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <button className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa sản phẩm</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa sản phẩm{" "}
                                <span className="font-semibold text-foreground">{product.name}</span>?
                                Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                asChild>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(Number(product._id))}
                                  disabled={deletingId === Number(product._id)}
                                >
                                  {deletingId === Number(product._id) ? "Đang xóa..." : "Xóa sản phẩm"}
                                </Button>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
