
import auth from "@/auth";
import { redirect } from "next/navigation";
import SellerProductsManager from "@/components/modules/website/account/SellerProductsManager";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { sellerProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Store } from "lucide-react";

export default async function SellerProductsPage() {
  const session = await auth();
  if (!session) {
    redirect("/signin?callbackUrl=/account/seller/products");
  }

  const userId = Number(session.user?.id);
  if (!userId || !Number.isFinite(userId)) {
    redirect("/account/profile");
  }

  const sellerRows = await db
    .select()
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, userId));

  if (sellerRows.length === 0) {
    redirect("/account/profile?sellerRequired=true");
  }

  return (
    <div className="space-y-5">
      <AccountPageHeader
        icon={Store}
        title="Sản phẩm của bạn"
        subtitle="Đăng bán mã nguồn, tài khoản AI, SaaS, template — quản lý biến thể và bàn giao."
        gradient="from-cyan-600 via-teal-600 to-emerald-600"
      />
      <SellerProductsManager />
    </div>
  );
}

export const metadata: Metadata = {
  title: "Sản phẩm người bán",
  description: "Quản lý đăng bán sản phẩm theo danh mục hệ thống",
};
