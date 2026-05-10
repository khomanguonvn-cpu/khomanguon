
import { josephan } from "./fonts";
import "./globals.css";
import * as React from "react";
import Providers from "@/providers";
import { Metadata } from "next";
import {
  SEO_DEFAULT_TITLE,
  SEO_TITLE_TEMPLATE,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_KEYWORDS,
  SEO_DEFAULT_BASE_URL,
  SEO_DEFAULT_OG_IMAGE_PATH,
  SEO_DEFAULT_FAVICON_PATH,
  SEO_SITE_NAME,
} from "@/lib/seo-constants";
import { getGlobalSeoSafe, parseSeoKeywords } from "@/lib/seo-config";

// NOTE: Không đặt force-dynamic ở root layout.
// generateMetadata() tự fetch admin config từ DB với timeout 2s.
// Nếu DB chậm → fallback về SEO_DEFAULT constants.
// Googlebot luôn thấy <title> trong HTML shell đầu tiên.

/**
 * ROOT METADATA – Ưu tiên admin DB config, fallback về constants.
 *
 * Luồng ưu tiên:
 * 1. Admin cấu hình qua /admin/seo → lưu DB (seo_site_title, seo_meta_description, ...)
 * 2. generateMetadata() lấy từ DB → áp dụng cho toàn site
 * 3. Nếu DB lỗi/chậm → dùng SEO_DEFAULT_* từ seo-constants.ts
 * 4. Page-level generateMetadata() có thể override thêm (title cụ thể cho từng trang)
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getGlobalSeoSafe();

  // Admin config → fallback constants
  const title = seo?.siteTitle || SEO_DEFAULT_TITLE;
  const description = seo?.metaDescription || SEO_DEFAULT_DESCRIPTION;
  const keywords = seo?.keywords
    ? parseSeoKeywords(seo.keywords)
    : SEO_DEFAULT_KEYWORDS;
  const favicon = seo?.favicon || SEO_DEFAULT_FAVICON_PATH;
  const ogImage = seo?.ogImage || SEO_DEFAULT_OG_IMAGE_PATH;
  const twitterHandle = seo?.twitterHandle || "";

  return {
    metadataBase: new URL(SEO_DEFAULT_BASE_URL),
    title: {
      default: title,
      template: SEO_TITLE_TEMPLATE,
    },
    description,
    applicationName: SEO_SITE_NAME,
    keywords,
    authors: [{ name: SEO_SITE_NAME }],
    publisher: SEO_SITE_NAME,

    icons: {
      icon: favicon,
    },

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
      title,
      description,
      ...(twitterHandle ? { creator: twitterHandle } : {}),
      siteId: SEO_SITE_NAME,
      images: [
        {
          url: ogImage.startsWith("http")
            ? ogImage
            : `${SEO_DEFAULT_BASE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImage.startsWith("http")
            ? ogImage
            : `${SEO_DEFAULT_BASE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
      url: SEO_DEFAULT_BASE_URL,
      siteName: SEO_SITE_NAME,
      locale: "vi_VN",
    },
  };
}

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
