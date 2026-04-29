import { Product } from "@/types";
import React from "react";
import ProductCard from "../../custom/ProductCard";
import { ShoppingBasket } from "lucide-react";

export default function ProductList({
  loading,
  products,
}: {
  loading: boolean;
  products: Product[];
}) {
  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <ProductCard key={`product-list-skeleton-${index}`} loading item={null} />
            ))
          : safeProducts.map((item: Product, index: number) => (
              <ProductCard
                loading={false}
                item={item}
                key={item._id || item.slug || index}
              />
            ))}
      </div>

      {!loading && safeProducts.length === 0 && (
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <ShoppingBasket className="h-14 w-14 text-slate-300" />
          <h1 className="text-xl font-black text-slate-900">Không tìm thấy sản phẩm nào</h1>
          <p className="max-w-md text-sm text-slate-500">
            Hãy thử đổi bộ lọc hoặc quay lại danh mục khác để xem thêm sản phẩm phù hợp.
          </p>
        </div>
      )}
    </>
  );
}
