
import CategoriesPage from "@/components/modules/website/categories/CategoriesPage";
import { mergeOpenGraph } from "@/lib/mergeOpenGraph";
import { Metadata } from "next";
import React from "react";
import { db } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { productCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getGlobalSeoSafe } from "@/lib/seo-config";
import {
  SEO_DEFAULT_FAVICON_PATH,
  SEO_SITE_NAME,
} from "@/lib/seo-constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await ensureDatabaseReady();
  const { slug } = await params;

  // Fetch category + admin SEO config song song
  const [cats, seo] = await Promise.all([
    db
      .select()
      .from(productCategories)
      .where(eq(productCategories.slug, slug))
      .limit(1),
    getGlobalSeoSafe(),
  ]);
  const cat = cats[0];
  const favicon = seo?.favicon || SEO_DEFAULT_FAVICON_PATH;
  const siteName = SEO_SITE_NAME;

  const title = cat?.name
    ? `${cat.name} - Sản phẩm chất lượng | ${siteName}`
    : `Danh mục sản phẩm | ${siteName}`;
  const description =
    cat?.description ||
    `Khám phá các sản phẩm ${cat?.name || "chất lượng cao"} tại ${siteName}. Mã nguồn, tài khoản số, AI, SaaS và nhiều hơn nữa.`;

  return {
    title,
    description,
    keywords: [cat?.name, "sản phẩm số", "mã nguồn", "tài khoản số", "AI", "SaaS", "KHOMANGUON"].filter(Boolean),
    alternates: {
      canonical: `/categories/${slug}/products`,
    },
    openGraph: mergeOpenGraph({
      title,
      description,
      url: `/categories/${slug}/products`,
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(seo?.twitterHandle ? { creator: seo.twitterHandle } : {}),
    },
    icons: { icon: favicon },
  };
}

export default async function page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoriesPage slug={slug} />;
}
