export const runtime = 'edge';

import ForgotPassword from "@/components/modules/website/auth/ForgotPassword";
import { Metadata } from "next";

export default function Page() {
  return <ForgotPassword />;
}

export const metadata: Metadata = {
  title: "Quên mật khẩu - KHOMANGUON",
  description: "Khôi phục mật khẩu bằng OTP email trên KHOMANGUON.IO.VN",
  icons: {
    icon: "/assets/images/logo.svg",
  },
};
