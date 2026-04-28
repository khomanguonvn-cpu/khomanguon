
import Cart from "@/components/modules/website/cart";
import { Metadata } from "next";
import React from "react";

export default async function page() {
  return <Cart />;
}

export const metadata: Metadata = {
  title: "Giỏ hàng",
  description: "Dự án thương mại điện tử được xây dựng bằng Next.js fullstack",
  icons: {
    icon: "/assets/images/logo.svg",
  },
};
