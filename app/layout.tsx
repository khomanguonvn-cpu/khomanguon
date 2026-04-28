
import { josephan } from "./fonts";
import "./globals.css";
import * as React from "react";
import Providers from "@/providers";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const baseUrl = "https://khomanguon.io.vn";

// SEO GLOBAL
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "KHOMANGUON.IO.VN - Chợ sản phẩm số hàng đầu Việt Nam",
    template: "%s | KHOMANGUON.IO.VN",
  },
  description: "Nền tảng mua bán mã nguồn, tài khoản số, công cụ AI, SaaS, game MMO - Giao dịch an toàn, thanh toán tự động",
  applicationName: "KHOMANGUON",
  keywords: [
    "khomanguon", "mã nguồn", "source code", "tài khoản số", "digital products",
    "AI tools", "MMO", "SaaS", "mua bán mã nguồn", "chợ sản phẩm số",
    "template", "game account", "phần mềm", "công cụ AI",
  ],
  authors: [{ name: "KHOMANGUON" }],
  publisher: "KHOMANGUON.IO.VN",

  alternates: {
    canonical: "/",
    languages: {
      vi: "vi",
    },
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },


  twitter: {
    card: "summary_large_image",
    title: "KHOMANGUON.IO.VN - Chợ sản phẩm số",
    description: "Nền tảng mua bán mã nguồn, tài khoản số, AI, MMO và SaaS",
    siteId: "KHOMANGUON",
    creator: "KHOMANGUON",
    images: [
      {
        url: `${baseUrl}/assets/images/og.png`,
        width: 1200,
        height: 630,
        alt: "KHOMANGUON.IO.VN - Chợ sản phẩm số",
      },
    ],
  },

  openGraph: {
    title: "KHOMANGUON.IO.VN - Chợ sản phẩm số",
    description: "Nền tảng trao đổi trực tiếp sản phẩm số dành cho cộng đồng Việt Nam",

    images: [
      {
        url: `${baseUrl}/assets/images/og.png`,
      },
    ],
    type: "website",
    url: `${baseUrl}`,
    siteName: "KHOMANGUON.IO.VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning className={`min-h-screen  ${josephan.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
