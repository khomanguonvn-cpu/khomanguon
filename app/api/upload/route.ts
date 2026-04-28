
import { NextRequest } from "next/server";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { createUploadPresignedUrl, isR2Configured } from "@/lib/r2";
import { getRequestId, logApiError } from "@/lib/observability";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized("Bạn cần đăng nhập để upload ảnh", { requestId });
    }

    if (!isR2Configured()) {
      return badRequest("Hệ thống upload ảnh chưa được cấu hình", { requestId });
    }

    const body = await request.json();
    const { fileName, mimeType, folder } = body as {
      fileName?: string;
      mimeType?: string;
      folder?: string;
    };

    if (!fileName || !mimeType) {
      return badRequest("Thiếu fileName hoặc mimeType", { requestId });
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return badRequest(
        `Chỉ chấp nhận: ${ALLOWED_TYPES.join(", ")}`,
        { requestId }
      );
    }

    const result = await createUploadPresignedUrl(
      String(folder || "kyc"),
      String(fileName),
      String(mimeType),
      300
    );

    if (!result.success) {
      return badRequest(result.error || "Tạo presigned URL thất bại", { requestId });
    }

    return ok({
      presignedUrl: result.presignedUrl,
      objectKey: result.objectKey,
      publicUrl: result.publicUrl,
      message: "Presigned URL tạo thành công",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/upload",
      message: "Upload ảnh thất bại",
      error,
    });
    return serverError("Không thể tạo presigned URL", { requestId });
  }
}
