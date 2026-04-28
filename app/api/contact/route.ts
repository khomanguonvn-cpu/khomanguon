export const runtime = 'edge';

import { db } from "@/lib/db";
import { contactMessages } from "@/lib/schema";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const body = await request.json();

    const subject = String(body?.subject || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();

    if (!subject || !email || !message) {
      logApiWarn({
        requestId,
        route: "POST /api/contact",
        message: "Thiếu thông tin liên hệ",
      });

      return badRequest("Vui lòng nhập đầy đủ thông tin", { requestId });
    }

    await db.insert(contactMessages).values({
      subject,
      email,
      message,
      createdAt: new Date().toISOString(),
    });

    return ok({
      message: "Đã ghi nhận liên hệ thành công",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/contact",
      message: "Không thể xử lý yêu cầu",
      error,
    });

    return serverError("Không thể xử lý yêu cầu", { requestId });
  }
}
