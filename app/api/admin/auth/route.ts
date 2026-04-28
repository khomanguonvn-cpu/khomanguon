
import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/api-auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { getRequestId, logApiError } from "@/lib/observability";
import { getOAuthConfig, invalidateOAuthConfigCache } from "@/lib/oauth-config";
import { systemIntegrations } from "@/lib/schema";

const OAUTH_FIELDS = [
  { field: "googleClientId", key: "google_oauth_client_id", isEncrypted: false },
  { field: "googleClientSecret", key: "google_oauth_client_secret", isEncrypted: true },
  { field: "facebookClientId", key: "facebook_oauth_client_id", isEncrypted: false },
  { field: "facebookClientSecret", key: "facebook_oauth_client_secret", isEncrypted: true },
] as const;

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền truy cập");
    }

    const config = await getOAuthConfig({ forceRefresh: true });

    return ok({
      data: {
        googleClientId: config.googleClientId,
        googleClientSecret: config.googleClientSecret,
        facebookClientId: config.facebookClientId,
        facebookClientSecret: config.facebookClientSecret,
      },
      source: config.source,
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/admin/auth",
      message: "Không thể tải cấu hình OAuth",
      error,
    });
    return serverError("Không thể tải cấu hình OAuth", { requestId });
  }
}

export async function PUT(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền cấu hình OAuth");
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return badRequest("Dữ liệu cấu hình không hợp lệ", { requestId });
    }

    const payload = body as Record<string, unknown>;
    const now = new Date().toISOString();
    const adminIdNumber = Number(adminUser.id);
    const updatedBy = Number.isFinite(adminIdNumber) ? adminIdNumber : null;

    let touchedFields = 0;
    for (const item of OAUTH_FIELDS) {
      if (!(item.field in payload)) {
        continue;
      }

      const value = normalize(payload[item.field]);

      await db
        .insert(systemIntegrations)
        .values({
          key: item.key,
          value,
          isEncrypted: item.isEncrypted,
          updatedBy,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: systemIntegrations.key,
          set: {
            value,
            isEncrypted: item.isEncrypted,
            updatedBy,
            updatedAt: now,
          },
        });

      touchedFields += 1;
    }

    if (touchedFields === 0) {
      return badRequest("Thiếu trường cần cập nhật", { requestId });
    }

    invalidateOAuthConfigCache();
    const config = await getOAuthConfig({ forceRefresh: true });

    return ok({
      success: true,
      message: "Đã lưu cấu hình Đăng nhập (OAuth)",
      data: {
        googleClientId: config.googleClientId,
        googleClientSecret: config.googleClientSecret,
        facebookClientId: config.facebookClientId,
        facebookClientSecret: config.facebookClientSecret,
      },
      source: config.source,
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "PUT /api/admin/auth",
      message: "Không thể lưu cấu hình OAuth",
      error,
    });
    return serverError("Không thể lưu cấu hình OAuth", { requestId });
  }
}
