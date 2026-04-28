import WalletCard from "@/components/modules/website/account/WalletCard";
import AccountPageHeader from "@/components/modules/website/account/AccountPageHeader";
import { Metadata } from "next";
import { Wallet } from "lucide-react";

export default function WalletPage() {
  return (
    <div className="space-y-5">
      <AccountPageHeader
        icon={Wallet}
        title="Ví số dư"
        subtitle="Quản lý số dư, nạp tiền qua PayOS, rút tiền về ngân hàng."
        gradient="from-emerald-600 via-teal-500 to-cyan-500"
      />
      <WalletCard />
    </div>
  );
}

export const metadata: Metadata = {
  title: "Ví số dư - Tài khoản",
  description: "Quản lý số dư, nạp tiền qua PayOS và rút tiền",
};
