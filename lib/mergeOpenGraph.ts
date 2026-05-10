import type { Metadata } from "next";
import {
  SEO_DEFAULT_TITLE,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_OG_IMAGE_PATH,
  SEO_SITE_NAME,
  getSeoBaseUrl,
} from "@/lib/seo-constants";

// Default open graph – phải khớp với nội dung SEO thực tế của website
// để Google luôn nhận được đúng thông tin khi fallback.

const defaultOpenGraph: Metadata["openGraph"] = {
  title: SEO_DEFAULT_TITLE,
  description: SEO_DEFAULT_DESCRIPTION,

  images: [
    {
      url: `${getSeoBaseUrl()}${SEO_DEFAULT_OG_IMAGE_PATH}`,
      width: 1200,
      height: 630,
      alt: `${SEO_SITE_NAME} - Chợ sản phẩm số`,
    },
  ],
  type: "website",
  url: getSeoBaseUrl(),
  siteName: SEO_SITE_NAME,
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
