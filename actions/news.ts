import { and, desc, eq, ne, sql } from "drizzle-orm";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { safeParseJsonList } from "@/lib/news";
import { newsPosts } from "@/lib/schema";

type NewsRow = typeof newsPosts.$inferSelect;

function mapNewsRow(row: NewsRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.coverImage,
    sourceUrl: row.sourceUrl,
    originalTitle: row.originalTitle,
    keywords: safeParseJsonList(row.keywordsJson, 20),
    tags: safeParseJsonList(row.tagsJson, 20),
    status: row.status,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getPublishedNewsPage(page = 1, limit = 50) {
  await ensureDatabaseReady();

  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safeLimit = Number.isFinite(limit)
    ? Math.min(100, Math.max(1, Math.floor(limit)))
    : 50;
  const offset = (safePage - 1) * safeLimit;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(newsPosts)
      .where(eq(newsPosts.status, "published"))
      .orderBy(desc(newsPosts.publishedAt), desc(newsPosts.id))
      .limit(safeLimit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(newsPosts)
      .where(eq(newsPosts.status, "published")),
  ]);

  const total = Number(countRows[0]?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    items: rows.map(mapNewsRow),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    },
  };
}

export async function getPublishedNewsBySlug(slug: string) {
  await ensureDatabaseReady();

  const value = String(slug || "").trim();
  if (!value) {
    return null;
  }

  const rows = await db
    .select()
    .from(newsPosts)
    .where(and(eq(newsPosts.slug, value), eq(newsPosts.status, "published")))
    .limit(1);

  const row = rows[0];
  return row ? mapNewsRow(row) : null;
}

export async function getRelatedPublishedNews(currentId: number, limit = 6) {
  await ensureDatabaseReady();

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 6;

  const rows = await db
    .select()
    .from(newsPosts)
    .where(
      and(
        eq(newsPosts.status, "published"),
        ne(newsPosts.id, Number(currentId) || 0)
      )
    )
    .orderBy(desc(newsPosts.publishedAt), desc(newsPosts.id))
    .limit(safeLimit);

  return rows.map(mapNewsRow);
}

