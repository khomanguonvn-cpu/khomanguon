
import { eq } from "drizzle-orm";
import { badRequest, forbidden, ok, serverError } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/api-auth";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { systemConfigs } from "@/lib/schema";
import { getRequestId, logApiError } from "@/lib/observability";

const WITHDRAW_FEE_CONFIG_KEY = "withdraw_fee_percent";
const WITHDRAW_FEE_CONFIG_DESC = "Phí rút tiền cho seller (% trên số tiền rút)";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const admin = await requireAdminUser();
    if (!admin?.id) {
      return forbidden("Chỉ dành cho Quản trị viên", { requestId });
    }

    const rows = await db
      .select({
        id: systemConfigs.id,
        key: systemConfigs.key,
        value: systemConfigs.value,
        description: systemConfigs.description,
        updatedAt: systemConfigs.updatedAt,
      })
      .from(systemConfigs)
      .where(eq(systemConfigs.key, WITHDRAW_FEE_CONFIG_KEY))
      .limit(1);

    const currentFeePercent = rows.length > 0
      ? parseFloat(rows[0].value)
      : 1;

    const config = {
      key: WITHDRAW_FEE_CONFIG_KEY,
      value: currentFeePercent,
      description: WITHDRAW_FEE_CONFIG_DESC,
      updatedAt: rows[0]?.updatedAt || null,
    };

    return ok({ data: config, requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/admin/withdrawal-fee",
      message: "Không thể tải cấu hình phí rút tiền",
      error,
    });
    return serverError("Không thể tải cấu hình phí rút tiền", { requestId });
  }
}

export async function PUT(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const admin = await requireAdminUser();
    if (!admin?.id) {
      return forbidden("Chỉ dành cho Quản trị viên", { requestId });
    }

    const body = await request.json();
    const feePercent = parseFloat(body?.feePercent ?? body?.value);

    if (!Number.isFinite(feePercent)) {
      return badRequest("Phần trăm phí rút tiền không hợp lệ", { requestId });
    }

    if (feePercent < 0 || feePercent > 100) {
      return badRequest("Phần trăm phí rút tiền phải nằm trong khoảng 0% - 100%", { requestId });
    }

    const nowIso = new Date().toISOString();

    const existing = await db
      .select({ id: systemConfigs.id })
      .from(systemConfigs)
      .where(eq(systemConfigs.key, WITHDRAW_FEE_CONFIG_KEY))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(systemConfigs)
        .set({
          value: String(feePercent),
          updatedBy: Number(admin.id),
          updatedAt: nowIso,
        })
        .where(eq(systemConfigs.key, WITHDRAW_FEE_CONFIG_KEY));
    } else {
      await db.insert(systemConfigs).values({
        key: WITHDRAW_FEE_CONFIG_KEY,
        value: String(feePercent),
        description: WITHDRAW_FEE_CONFIG_DESC,
        updatedBy: Number(admin.id),
        updatedAt: nowIso,
      });
    }

    return ok({
      message: `Đã cập nhật phí rút tiền thành ${feePercent}%`,
      data: {
        key: WITHDRAW_FEE_CONFIG_KEY,
        value: feePercent,
        description: WITHDRAW_FEE_CONFIG_DESC,
        updatedAt: nowIso,
      },
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "PUT /api/admin/withdrawal-fee",
      message: "Không thể cập nhật phí rút tiền",
      error,
    });
    return serverError("Không thể cập nhật phí rút tiền", { requestId });
  }
}
