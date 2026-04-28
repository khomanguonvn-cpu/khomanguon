import CategoriesPage from "@/components/modules/website/categories/CategoriesPage";
import { mergeOpenGraph } from "@/lib/mergeOpenGraph";
import { Metadata } from "next";
import React from "react";
import { db } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { productCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  await ensureDatabaseReady();
  const cats = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.slug, params.slug))
    .limit(1);
  const cat = cats[0];

  const title = cat?.name
    ? `${cat.name} - Sản phẩm chất lượng | KHOMANGUON.IO.VN`
    : "Danh mục sản phẩm | KHOMANGUON.IO.VN";
  const description =
    cat?.description ||
    `Khám phá các sản phẩm ${cat?.name || "chất lượng cao"} tại KHOMANGUON.IO.VN. Mã nguồn, tài khoản số, AI, SaaS và nhiều hơn nữa.`;

  return {
    title,
    description,
    keywords: [cat?.name, "sản phẩm số", "mã nguồn", "tài khoản số", "AI", "SaaS", "KHOMANGUON"].filter(Boolean),
    alternates: {
      canonical: `/categories/${params.slug}/products`,
    },
    openGraph: mergeOpenGraph({
      title,
      description,
      url: `/categories/${params.slug}/products`,
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    icons: { icon: "/assets/images/logo.svg" },
  };
}

export default function page({ params }: { params: { slug: string } }) {
  return <CategoriesPage slug={params.slug} />;
}
