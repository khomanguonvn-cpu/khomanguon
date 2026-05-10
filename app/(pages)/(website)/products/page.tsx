
import ProductsPage from "@/components/modules/website/products/ProductsPage";
import { mergeOpenGraph } from "@/lib/mergeOpenGraph";
import { Metadata } from "next";
import React from "react";
import { getGlobalSeoSafe } from "@/lib/seo-config";
import {
  SEO_DEFAULT_FAVICON_PATH,
  SEO_SITE_NAME,
} from "@/lib/seo-constants";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getGlobalSeoSafe();
  const favicon = seo?.favicon || SEO_DEFAULT_FAVICON_PATH;
  const siteName = SEO_SITE_NAME;

  const title = `Cửa hàng sản phẩm số | ${siteName}`;
  const description =
    `Khám phá kho sản phẩm số đa dạng tại ${siteName} - Mã nguồn, tài khoản số, AI, SaaS, dịch vụ MMO và nhiều hơn nữa.`;

  return {
    title,
    description,
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
      title,
      description: `Kho sản phẩm số đa dạng - Mã nguồn, tài khoản số, AI, SaaS, MMO.`,
      url: "/products",
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description: `Kho sản phẩm số đa dạng - Mã nguồn, tài khoản số, AI, SaaS, MMO.`,
      ...(seo?.twitterHandle ? { creator: seo.twitterHandle } : {}),
    },
    icons: { icon: favicon },
  };
}

export default function page() {
  return <ProductsPage />;
}
