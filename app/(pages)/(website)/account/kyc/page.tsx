
import Profile from "@/components/modules/website/account/Profile";
import { getUserById } from "@/actions/user";
import auth from "@/auth";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";
import { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

export default async function KycPage() {
  const session = await auth();
  const user = await getUserById(session?.user?.id);

  if (!user) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center border border-slate-200 bg-white p-8"
        style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }}
      >
        <p className="text-slate-500">Không tìm thấy thông tin người dùng.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AccountPageHeader
        icon={ShieldCheck}
        title="KYC CCCD & Khu Vực Người Bán"
        subtitle="Xác minh danh tính để mở khóa tính năng đăng bán và rút tiền."
        gradient="from-amber-500 via-orange-500 to-rose-600"
      />

      <div
        className="border border-slate-200 bg-white p-4 sm:p-6 lg:p-7"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        <Profile user={user} section="kyc" />
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "KYC CCCD - Tài khoản",
  description: "Xác minh KYC CCCD cho tài khoản seller",
};
