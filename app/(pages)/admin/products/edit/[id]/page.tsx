import auth from "@/auth";
import { redirect } from "next/navigation";
import SellerProductsManager from "@/components/modules/website/account/SellerProductsManager";
import { db } from "@/lib/db";
import { sellerProducts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Package, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/admin/products");
  }

  const { id } = await params;
  const productId = Number(id);

  if (!productId) {
    redirect("/admin/products");
  }

  const existingRows = await db
    .select()
    .from(sellerProducts)
    .where(eq(sellerProducts.id, productId))
    .limit(1);

  const product = existingRows[0];

  if (!product) {
    redirect("/admin/products");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <Link
          href="/admin/products"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-600" />
            Sửa sản phẩm người bán
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Chỉnh sửa sản phẩm <span className="font-semibold text-slate-700">{product.name}</span> của người bán ID: {product.sellerId}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200">
        <SellerProductsManager defaultEditProductId={productId} adminViewSellerId={product.sellerId} />
      </div>
    </div>
  );
}
