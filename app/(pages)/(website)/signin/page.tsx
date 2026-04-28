import Login from "@/components/modules/website/auth/Login";
import { Metadata } from "next";

export default function Page() {
  return <Login mode="page" />;
}

export const metadata: Metadata = {
  title: "Đăng nhập - KHOMANGUON",
  description: "Đăng nhập vào tài khoản KHOMANGUON.IO.VN",
};
