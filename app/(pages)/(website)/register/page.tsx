import auth from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import RegisterPageClient from "./RegisterPageClient";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản – KhoMaNguon",
  description: "Tạo tài khoản KhoMaNguon để mua sắm sản phẩm số, tài khoản AI, mã nguồn và nhiều hơn nữa.",
  icons: { icon: "/assets/images/logo.svg" },
};

export default async function RegisterPage() {
  const session = await auth();
  // If already logged in → go home
  if (session?.user?.id) redirect("/");
  return <RegisterPageClient />;
}
