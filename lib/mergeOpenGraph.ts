import type { Metadata } from "next";

// Default open graph – phải khớp với nội dung SEO thực tế của website
// để Google luôn nhận được đúng thông tin khi fallback.

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://khomanguon.io.vn";

const defaultOpenGraph: Metadata["openGraph"] = {
  title: "KHOMANGUON.IO.VN - Chợ Mua Bán Mã Nguồn & Tài Khoản Số",
  description:
    "Nền tảng mua bán mã nguồn, tài khoản số, công cụ AI, SaaS, game MMO - Giao dịch an toàn, thanh toán tự động",

  images: [
    {
      url: `${baseUrl}/assets/images/og.png`,
      width: 1200,
      height: 630,
      alt: "KHOMANGUON.IO.VN - Chợ sản phẩm số",
    },
  ],
  type: "website",
  url: `${baseUrl}`,
  siteName: "KHOMANGUON.IO.VN",
  locale: "vi_VN",
};

// Dynamic open graph

export const mergeOpenGraph = (og?: Metadata["openGraph"]) => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
    title: og?.title ? og.title : defaultOpenGraph.title,
    url: og?.url ? og.url : defaultOpenGraph.url,
  };
};
