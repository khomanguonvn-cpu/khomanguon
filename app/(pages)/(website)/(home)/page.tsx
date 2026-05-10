
import Banner from "@/components/modules/website/home/Banner";
import BestSellersProducts from "@/components/modules/website/home/BestSellersProducts";
import BrandList from "@/components/modules/website/home/BrandList";
import FeaturesProducts from "@/components/modules/website/home/FeaturesProducts";
import TopCategories from "@/components/modules/website/home/TopCategories";
import TrustBadges from "@/components/modules/website/home/TrustBadges";
import NewsletterCTA from "@/components/modules/website/home/NewsletterCTA";
import CategoryProductsSection from "@/components/modules/website/home/CategoryProductsSection";
import { Code, User, Bot, Globe, Cloud } from "lucide-react";
import * as React from "react";
import Script from "next/script";
import { Metadata } from "next";
import { mergeOpenGraph } from "@/lib/mergeOpenGraph";
import { getSeoSettings, parseSeoKeywords } from "@/lib/seo-config";

// Dynamic rendering cho page này (data sản phẩm, SEO config từ DB)
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";


const FALLBACK_TITLE = "KHOMANGUON.IO.VN - Chợ Mua Bán Mã Nguồn & Tài Khoản Số";
const FALLBACK_DESCRIPTION =
  "Nền tảng mua bán và trao đổi trực tiếp mã nguồn, tài khoản số, AI, MMO, SaaS - Giao dịch an toàn, thanh toán tự động 24/7";

function getBaseUrl() {
  const fromEnv = String(process.env.NEXT_PUBLIC_SERVER_URL || "").trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  return "https://khomanguon.io.vn";
}

function parseCustomSchema(input: string) {
  const value = String(input || "").trim();
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean);
    }
    if (parsed && typeof parsed === "object") {
      return [parsed];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Lấy SEO data với timeout ngắn. Nếu database chậm/lỗi,
 * trả về null để generateMetadata dùng fallback tĩnh.
 * Đây là cách đảm bảo <title> LUÔN xuất hiện trong HTML shell
 * bất kể database có trả lời kịp hay không.
 */
async function getHomeSeoDataSafe() {
  try {
    const seo = await Promise.race([
      getSeoSettings(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);

    if (!seo) return null;

    const baseUrl = getBaseUrl();
    const title = seo.siteTitle || FALLBACK_TITLE;
    const description = seo.metaDescription || FALLBACK_DESCRIPTION;
    const keywords = parseSeoKeywords(seo.keywords);

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: seo.schemaOrganizationName || title,
      url: seo.schemaOrganizationUrl || baseUrl,
      logo: seo.schemaOrganizationLogo || `${baseUrl}/assets/images/logo.svg`,
      ...(seo.facebookUrl ? { sameAs: [seo.facebookUrl] } : {}),
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: seo.schemaWebsiteName || title,
      url: seo.schemaOrganizationUrl || baseUrl,
    };

    const schemas = [organizationSchema, websiteSchema, ...parseCustomSchema(seo.schemaCustomJson)];

    return {
      seo,
      title,
      description,
      keywords,
      schemas,
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const data = await getHomeSeoDataSafe();
  const seo = data?.seo;
  const schemas = data?.schemas || [];
  const analyticsGoogleId = String(seo?.analyticsGoogleId || "").trim();
  const analyticsGtmId = String(seo?.analyticsGtmId || "").trim();

  return (
    <>
      {analyticsGtmId && (
        <Script id="gtm-init" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${analyticsGtmId}');
        `}</Script>
      )}

      {analyticsGoogleId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsGoogleId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${analyticsGoogleId}');
          `}</Script>
        </>
      )}

      {schemas.map((schema, index) => (
        <script
          key={`home-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {analyticsGtmId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${analyticsGtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      )}

      <Banner />
      <TrustBadges />
      <FeaturesProducts />
      <BestSellersProducts />
      
      {/* Các chuyên mục sản phẩm theo yêu cầu */}
      <CategoryProductsSection title="Mã Nguồn" categorySlug="ma-nguon" icon={<Code className="h-4 w-4" />} />
      <CategoryProductsSection title="Tài Khoản" categorySlug="tai-khoan" icon={<User className="h-4 w-4" />} />
      <CategoryProductsSection title="Tài Khoản AI" categorySlug="tai-khoan-ai" icon={<Bot className="h-4 w-4" />} />
      <CategoryProductsSection title="MMO" categorySlug="mmo" icon={<Globe className="h-4 w-4" />} />
      <CategoryProductsSection title="SaaS" categorySlug="saas" icon={<Cloud className="h-4 w-4" />} />

      <BrandList />
      <NewsletterCTA />
    </>
  );
}

/**
 * generateMetadata - CRITICAL cho SEO
 * 
 * Hàm này PHẢI trả về metadata nhanh nhất có thể.
 * Nếu database chậm → dùng fallback tĩnh để đảm bảo
 * <title> và <meta> LUÔN có trong HTML response đầu tiên.
 */
export async function generateMetadata(): Promise<Metadata> {
  const data = await getHomeSeoDataSafe();

  // Fallback tĩnh - luôn đảm bảo có title & description
  const title = data?.title || FALLBACK_TITLE;
  const description = data?.description || FALLBACK_DESCRIPTION;
  const keywords = data?.keywords || [
    "khomanguon", "mã nguồn", "source code", "tài khoản số",
    "AI tools", "MMO", "SaaS", "mua bán mã nguồn", "chợ sản phẩm số",
  ];
  const icon = data?.seo?.favicon || "/assets/images/logo.svg";
  const image = data?.seo?.ogImage || "/assets/images/og.png";

  return {
    title,
    description,
    ...(keywords.length > 0 ? { keywords } : {}),
    icons: {
      icon,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(data?.seo?.twitterHandle ? { creator: data.seo.twitterHandle } : {}),
      images: [image],
    },
    openGraph: mergeOpenGraph({
      title,
      description,
      url: "/",
      images: [{ url: image }],
    }),
  };
}
