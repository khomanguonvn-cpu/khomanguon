import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/api-auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/api-response";
import { crawlArticleFromUrl } from "@/lib/news";
import { getRequestId, logApiError } from "@/lib/observability";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền cào bài viết");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const url = String(body.url || "").trim();

    if (!url) {
      return badRequest("Thiếu URL cần cào", { requestId });
    }

    const crawled = await crawlArticleFromUrl(url);

    return ok({
      message: "Đã cào bài viết thành công",
      data: crawled,
      requestId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logApiError({
      requestId,
      route: "POST /api/admin/news/crawl",
      message: `Crawl failed: ${message}`,
      error,
    });
    // Surface the real error message to the client
    return serverError(`Không thể cào bài viết: ${message}`, { requestId });
  }
}
