export const runtime = 'edge';

import ProductsPage from "@/components/modules/website/products/ProductsPage";
import { mergeOpenGraph } from "@/lib/mergeOpenGraph";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Cửa hàng sản phẩm số | KHOMANGUON.IO.VN",
  description:
    "Khám phá kho sản phẩm số đa dạng tại KHOMANGUON.IO.VN - Mã nguồn, tài khoản số, AI, SaaS, dịch vụ MMO và nhiều hơn nữa.",
  keywords: [
    "sản phẩm số",
    "mã nguồn",
    "tài khoản số",
    "AI",
    "SaaS",
    "MMO",
    "mua bán",
    "khomanguon",
  ],
  alternates: {
    canonical: "/products",
  },
  openGraph: mergeOpenGraph({
    title: "Cửa hàng sản phẩm số | KHOMANGUON.IO.VN",
    description: "Kho sản phẩm số đa dạng - Mã nguồn, tài khoản số, AI, SaaS, MMO.",
    url: "/products",
  }),
  twitter: {
    card: "summary_large_image",
    title: "Cửa hàng sản phẩm số | KHOMANGUON.IO.VN",
    description: "Kho sản phẩm số đa dạng - Mã nguồn, tài khoản số, AI, SaaS, MMO.",
  },
  icons: { icon: "/assets/images/logo.svg" },
};

export default function page() {
  return <ProductsPage />;
}
