import auth from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export default async function page() {
  await auth();
  redirect("/");
}

export const metadata: Metadata = {
  title: "Đăng ký - KHOMANGUON",
  description: "Đăng ký qua popup tại trang chủ KHOMANGUON.IO.VN",
  icons: {
    icon: "/assets/images/logo.svg",
  },
};
