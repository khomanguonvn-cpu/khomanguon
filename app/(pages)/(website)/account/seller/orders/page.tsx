
import auth from "@/auth";
import SellerOrdersManager from "@/components/modules/website/account/SellerOrdersManager";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export default async function SellerOrdersPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return <SellerOrdersManager />;
}

export const metadata: Metadata = {
  title: "Đơn cần trả - KHOMANGUON",
  description: "Quản lý và trả đơn hàng cho người mua",
};
