export const runtime = 'edge';

import Profile from "@/components/modules/website/account/Profile";
import { getUserById } from "@/actions/user";
import auth from "@/auth";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";
import { Metadata } from "next";
import { UserCircle2 } from "lucide-react";

export default async function Page() {
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
        icon={UserCircle2}
        title="Hồ sơ tài khoản"
        subtitle="Cập nhật thông tin cá nhân, ảnh đại diện và mật khẩu."
        gradient="from-sky-600 via-cyan-600 to-blue-700"
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
        <Profile user={user} section="account" />
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Hồ sơ - Tài khoản",
  description: "Quản lý hồ sơ tài khoản KHOMANGUON.IO.VN",
};
