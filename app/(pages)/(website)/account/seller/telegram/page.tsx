
import auth from "@/auth";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";
import SellerTelegramSetup from "@/components/modules/website/account/SellerTelegramSetup";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Send } from "lucide-react";

export default async function SellerTelegramPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <div className="space-y-5">
      <AccountPageHeader
        icon={Send}
        title="Telegram Bot"
        subtitle="Kết nối Telegram để nhận thông báo đơn hàng tức thì."
        gradient="from-sky-600 via-blue-600 to-indigo-700"
      />
      <SellerTelegramSetup />
    </div>
  );
}

export const metadata: Metadata = {
  title: "Telegram Bot - KHOMANGUON",
  description: "Cấu hình Telegram Bot để nhận thông báo đơn hàng",
};
