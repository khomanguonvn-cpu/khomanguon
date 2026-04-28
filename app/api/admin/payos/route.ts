import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/api-auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { getRequestId, logApiError } from "@/lib/observability";
import { getPayOSConfig, invalidatePayOSConfigCache } from "@/lib/payos-config";
import { systemIntegrations } from "@/lib/schema";

const PAYOS_FIELDS = [
  { field: "clientId", key: "payos_client_id", isEncrypted: false },
  { field: "apiKey", key: "payos_api_key", isEncrypted: true },
  { field: "checksumKey", key: "payos_checksum_key", isEncrypted: true },
  { field: "apiEndpoint", key: "payos_api_endpoint", isEncrypted: false },
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

    const config = await getPayOSConfig({ forceRefresh: true });

    return ok({
      data: {
        clientId: config.clientId,
        apiKey: config.apiKey,
        checksumKey: config.checksumKey,
        apiEndpoint: config.apiEndpoint,
      },
      source: config.source,
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/admin/payos",
      message: "Không thể tải cấu hình PayOS",
      error,
    });
    return serverError("Không thể tải cấu hình PayOS", { requestId });
  }
}

export async function PUT(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền cấu hình PayOS");
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
    for (const item of PAYOS_FIELDS) {
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

    invalidatePayOSConfigCache();
    const config = await getPayOSConfig({ forceRefresh: true });

    return ok({
      success: true,
      message: "Đã lưu cấu hình PayOS",
      data: {
        clientId: config.clientId,
        apiKey: config.apiKey,
        checksumKey: config.checksumKey,
        apiEndpoint: config.apiEndpoint,
      },
      source: config.source,
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "PUT /api/admin/payos",
      message: "Không thể lưu cấu hình PayOS",
      error,
    });
    return serverError("Không thể lưu cấu hình PayOS", { requestId });
  }
}

