
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

const FALLBACK_TITLE = "KHOMANGUON.IO.VN - Chợ sản phẩm số";
const FALLBACK_DESCRIPTION =
  "Nền tảng mua bán và trao đổi trực tiếp mã nguồn, tài khoản số, AI, MMO, SaaS";

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

async function getHomeSeoData() {
  const seo = await getSeoSettings();
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
}

export default async function Home() {
  const { seo, schemas } = await getHomeSeoData();
  const analyticsGoogleId = String(seo.analyticsGoogleId || "").trim();
  const analyticsGtmId = String(seo.analyticsGtmId || "").trim();

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

export async function generateMetadata(): Promise<Metadata> {
  const { seo, title, description, keywords } = await getHomeSeoData();

  const icon = seo.favicon || "/assets/images/logo.svg";
  const image = seo.ogImage || "/assets/images/og.png";

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
      ...(seo.twitterHandle ? { creator: seo.twitterHandle } : {}),
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
