
import { Metadata } from "next";
import auth from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/account/dashboard");
  }

  redirect("/account/dashboard");
}

export const metadata: Metadata = {
  title: "Điều hướng tài khoản",
  description: "Trang này đã được chuyển hướng về dashboard dành cho sản phẩm số",
  icons: {
    icon: "/assets/images/logo.svg",
  },
};
