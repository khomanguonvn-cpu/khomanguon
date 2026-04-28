import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/api-auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/api-response";
import { NEWS_AI_PROMPT_TEMPLATE, rewriteNewsWithAI } from "@/lib/news";
import { getRequestId, logApiError } from "@/lib/observability";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền viết lại bằng AI");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const sourceUrl = String(body.sourceUrl || "").trim();
    const customPrompt = String(body.customPrompt || "").trim();
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

    if (!title && !content) {
      return badRequest("Cần có tiêu đề hoặc nội dung để AI viết lại", { requestId });
    }

    const rewritten = await rewriteNewsWithAI({
      title,
      content,
      sourceUrl,
      customPrompt,
      imageUrls,
    });

    return ok({
      message: "Đã xử lý viết lại bài bằng AI",
      data: rewritten,
      promptTemplate: NEWS_AI_PROMPT_TEMPLATE,
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/admin/news/rewrite",
      message: "Không thể viết lại bài bằng AI",
      error,
    });
    return serverError("Không thể viết lại bài bằng AI", { requestId });
  }
}
