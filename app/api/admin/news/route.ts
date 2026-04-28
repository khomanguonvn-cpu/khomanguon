
import { NextRequest } from "next/server";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { requireAdminUser } from "@/lib/api-auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { buildExcerpt, extractKeywords, normalizeListInput, safeParseJsonList, sanitizeNewsContent, slugifyNewsTitle } from "@/lib/news";
import { getRequestId, logApiError } from "@/lib/observability";
import { newsPosts } from "@/lib/schema";

type NewsRow = typeof newsPosts.$inferSelect;

function mapRow(row: NewsRow) {
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

function normalizeStatus(value: unknown) {
  const status = String(value || "").trim().toLowerCase();
  return status === "published" ? "published" : "draft";
}

async function findById(id: number) {
  const rows = await db.select().from(newsPosts).where(eq(newsPosts.id, id)).limit(1);
  return rows[0] || null;
}

async function generateUniqueSlug(baseSlug: string, ignoreId?: number) {
  const root = slugifyNewsTitle(baseSlug);
  let candidate = root;
  let index = 2;

  while (true) {
    const rows = await db.select().from(newsPosts).where(eq(newsPosts.slug, candidate)).limit(1);
    const existed = rows[0];

    if (!existed || (Number.isFinite(ignoreId) && existed.id === ignoreId)) {
      return candidate;
    }

    candidate = `${root}-${index}`;
    index += 1;
  }
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền truy cập");
    }

    const { searchParams } = new URL(request.url);
    const pageRaw = Number(searchParams.get("page") || 1);
    const limitRaw = Number(searchParams.get("limit") || 20);
    const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
    const limit = Number.isFinite(limitRaw)
      ? Math.min(100, Math.max(1, Math.floor(limitRaw)))
      : 20;
    const search = String(searchParams.get("search") || "").trim();
    const statusFilterRaw = String(searchParams.get("status") || "").trim().toLowerCase();
    const statusFilter =
      statusFilterRaw === "draft" || statusFilterRaw === "published"
        ? statusFilterRaw
        : "";

    const conditions = [];
    if (statusFilter) {
      conditions.push(eq(newsPosts.status, statusFilter));
    }
    if (search) {
      conditions.push(like(newsPosts.title, `%${search}%`));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(newsPosts)
        .where(whereClause)
        .orderBy(desc(newsPosts.publishedAt), desc(newsPosts.createdAt), desc(newsPosts.id))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(newsPosts).where(whereClause),
    ]);

    const total = Number(countRows[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return ok({
      data: rows.map(mapRow),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/admin/news",
      message: "Không thể tải danh sách tin tức",
      error,
    });
    return serverError("Không thể tải danh sách tin tức", { requestId });
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền tạo tin tức");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const title = String(body.title || "").trim();
    const content = sanitizeNewsContent(String(body.content || ""));

    if (!title) {
      return badRequest("Thiếu tiêu đề bài viết", { requestId });
    }

    const status = normalizeStatus(body.status);
    const now = new Date().toISOString();
    const adminId = Number(adminUser.id);
    const fallbackKeywords = extractKeywords(`${title}\n${content}`, 10);
    const keywords = normalizeListInput(body.keywords, 20);
    const tags = normalizeListInput(body.tags, 20);
    const slugSource = String(body.slug || "").trim() || title;
    const slug = await generateUniqueSlug(slugSource);

    const publishedAt =
      status === "published"
        ? String(body.publishedAt || "").trim() || now
        : null;

    const insertedRows = await db
      .insert(newsPosts)
      .values({
        slug,
        title,
        excerpt: String(body.excerpt || "").trim() || buildExcerpt(content, 180),
        content,
        coverImage: String(body.coverImage || "").trim(),
        sourceUrl: String(body.sourceUrl || "").trim(),
        originalTitle: String(body.originalTitle || "").trim(),
        keywordsJson: JSON.stringify(
          keywords.length > 0 ? keywords : fallbackKeywords
        ),
        tagsJson: JSON.stringify(
          tags.length > 0 ? tags : (keywords.length > 0 ? keywords : fallbackKeywords).slice(0, 8)
        ),
        status,
        createdBy: Number.isFinite(adminId) ? adminId : null,
        updatedBy: Number.isFinite(adminId) ? adminId : null,
        publishedAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return ok({
      message: "Đã tạo bài viết tin tức",
      data: mapRow(insertedRows[0]),
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/admin/news",
      message: "Không thể tạo tin tức",
      error,
    });
    return serverError("Không thể tạo tin tức", { requestId });
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền cập nhật tin tức");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);

    if (!Number.isFinite(id) || id <= 0) {
      return badRequest("ID bài viết không hợp lệ", { requestId });
    }

    const existing = await findById(id);
    if (!existing) {
      return badRequest("Không tìm thấy bài viết", { requestId });
    }

    const now = new Date().toISOString();
    const adminId = Number(adminUser.id);
    const title =
      body.title !== undefined ? String(body.title || "").trim() : existing.title;
    const content =
      body.content !== undefined
        ? sanitizeNewsContent(String(body.content || ""))
        : existing.content;

    if (!title) {
      return badRequest("Tiêu đề bài viết không được để trống", { requestId });
    }

    const status = body.status !== undefined ? normalizeStatus(body.status) : existing.status;
    const slugSource =
      String(body.slug || "").trim() ||
      (body.title !== undefined ? title : existing.slug);
    const slug =
      body.slug !== undefined || body.title !== undefined
        ? await generateUniqueSlug(slugSource, id)
        : existing.slug;

    const fallbackKeywords = extractKeywords(`${title}\n${content}`, 10);
    const keywords =
      body.keywords !== undefined
        ? normalizeListInput(body.keywords, 20)
        : safeParseJsonList(existing.keywordsJson, 20);
    const tags =
      body.tags !== undefined
        ? normalizeListInput(body.tags, 20)
        : safeParseJsonList(existing.tagsJson, 20);

    const publishedAt =
      status === "published"
        ? String(body.publishedAt || "").trim() || existing.publishedAt || now
        : null;

    await db
      .update(newsPosts)
      .set({
        slug,
        title,
        excerpt:
          body.excerpt !== undefined
            ? String(body.excerpt || "").trim() || buildExcerpt(content, 180)
            : existing.excerpt || buildExcerpt(content, 180),
        content,
        coverImage:
          body.coverImage !== undefined
            ? String(body.coverImage || "").trim()
            : existing.coverImage,
        sourceUrl:
          body.sourceUrl !== undefined
            ? String(body.sourceUrl || "").trim()
            : existing.sourceUrl,
        originalTitle:
          body.originalTitle !== undefined
            ? String(body.originalTitle || "").trim()
            : existing.originalTitle,
        keywordsJson: JSON.stringify(
          keywords.length > 0 ? keywords : fallbackKeywords
        ),
        tagsJson: JSON.stringify(
          tags.length > 0 ? tags : (keywords.length > 0 ? keywords : fallbackKeywords).slice(0, 8)
        ),
        status,
        updatedBy: Number.isFinite(adminId) ? adminId : null,
        publishedAt,
        updatedAt: now,
      })
      .where(eq(newsPosts.id, id));

    const updated = await findById(id);
    if (!updated) {
      return badRequest("Không tìm thấy bài viết sau khi cập nhật", { requestId });
    }

    return ok({
      message: "Đã cập nhật bài viết tin tức",
      data: mapRow(updated),
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "PATCH /api/admin/news",
      message: "Không thể cập nhật tin tức",
      error,
    });
    return serverError("Không thể cập nhật tin tức", { requestId });
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền xóa tin tức");
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isFinite(id) || id <= 0) {
      return badRequest("ID bài viết không hợp lệ", { requestId });
    }

    await db.delete(newsPosts).where(eq(newsPosts.id, id));

    return ok({
      message: "Đã xóa bài viết tin tức",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "DELETE /api/admin/news",
      message: "Không thể xóa tin tức",
      error,
    });
    return serverError("Không thể xóa tin tức", { requestId });
  }
}
