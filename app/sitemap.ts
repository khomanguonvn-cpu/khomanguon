
import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { newsPosts, sellerProducts, productCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { ensureDatabaseReady } from "@/lib/bootstrap";

const BASE_URL = "https://khomanguon.io.vn";

export const dynamic = "force-dynamic";

async function getProductSlugsSafe() {
  try {
    const rows = await db
      .select({
        slug: sellerProducts.slug,
        updatedAt: sellerProducts.updatedAt,
      })
      .from(sellerProducts)
      .where(eq(sellerProducts.status, "active"));
    return rows;
  } catch (e) {
    console.error("[sitemap] products error:", e);
    return [];
  }
}

async function getCategorySlugsSafe() {
  try {
    const rows = await db
      .select({
        slug: productCategories.slug,
      })
      .from(productCategories);
    return rows;
  } catch {
    return [];
  }
}

async function getNewsSlugsSafe() {
  try {
    const rows = await db
      .select({ slug: newsPosts.slug, updatedAt: newsPosts.updatedAt })
      .from(newsPosts)
      .where(eq(newsPosts.status, "published"));
    return rows;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureDatabaseReady();

  const now = new Date().toISOString();

  const staticPages = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE_URL}/tin-tuc`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/guide`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  const [products, categories, news] = await Promise.all([
    getProductSlugsSafe(),
    getCategorySlugsSafe(),
    getNewsSlugsSafe(),
  ]);

  const productPages = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt || now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryPages = categories.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}/products`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const newsPages = news.map((n) => ({
    url: `${BASE_URL}/tin-tuc/${n.slug}`,
    lastModified: n.updatedAt || now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...newsPages];
}
