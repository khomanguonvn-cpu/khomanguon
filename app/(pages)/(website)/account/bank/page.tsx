export const runtime = 'edge';

import Profile from "@/components/modules/website/account/Profile";
import { getUserById } from "@/actions/user";
import auth from "@/auth";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";
import { Metadata } from "next";
import { Landmark } from "lucide-react";

export default async function BankPage() {
  const session = await auth();
  const user = await getUserById(session?.user?.id);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8">
        <p className="text-slate-500">Không tìm thấy thông tin người dùng.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AccountPageHeader
        icon={Landmark}
        title="Ngân hàng rút tiền"
        subtitle="Quản lý tài khoản ngân hàng để nhận tiền nhanh chóng và an toàn."
        gradient="from-blue-600 via-indigo-600 to-violet-600"
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
        <Profile user={user} section="bank" />
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Ngân hàng - Tài khoản",
  description: "Quản lý thông tin ngân hàng rút tiền",
};
