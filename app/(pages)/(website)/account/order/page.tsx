export const runtime = 'edge';

import { getOrdersByUserId } from "@/actions/order";
import auth from "@/auth";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";
import Orders from "@/components/modules/website/account/Orders";
import { Metadata } from "next";
import React from "react";
import { History } from "lucide-react";

export default async function Page() {
  const session = await auth();
  const orders = await getOrdersByUserId(session?.user?.id);

  return (
    <div className="space-y-5">
      <AccountPageHeader
        icon={History}
        title="Lịch sử mua hàng"
        subtitle="Theo dõi trạng thái trả đơn và chi tiết từng đơn hàng của bạn."
        gradient="from-indigo-600 via-violet-600 to-purple-600"
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <Orders data={orders} />
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Lịch sử mua hàng - Tài khoản",
  description: "Theo dõi và quản lý lịch sử mua hàng của bạn",
};
