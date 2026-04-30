import { getUserById } from "@/actions/user";
import auth from "@/auth";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";
import AffiliatePanel from "@/components/modules/website/account/AffiliatePanel";
import { redirect } from "next/navigation";
import { BadgePercent } from "lucide-react";

export const metadata = {
  title: "Affiliate – Kiếm hoa hồng | KhoMaNguon",
  description: "Giới thiệu bạn bè và nhận 1% hoa hồng từ mỗi lần họ nạp tiền trong 365 ngày.",
};

export default async function AffiliatePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const user = await getUserById(session.user.id);

  return (
    <div className="space-y-4">
      <AccountPageHeader
        icon={BadgePercent}
        title="Affiliate"
        subtitle="Kiếm hoa hồng khi giới thiệu bạn bè nạp tiền"
        gradient="from-violet-600 via-primary-600 to-indigo-700"
      />
      <AffiliatePanel />
    </div>
  );
}
