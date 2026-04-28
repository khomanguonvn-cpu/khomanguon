export const runtime = 'edge';

import { db } from "@/lib/db";
import { addresses } from "@/lib/schema";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { requireSessionUser } from "@/lib/api-auth";
import { shippingCreateSchema, zodDetails } from "@/lib/validators";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({ requestId, route: "POST /api/shipping", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const body = await request.json();
    const parsed = shippingCreateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dữ liệu không hợp lệ", {
        requestId,
        fields: zodDetails(parsed.error),
      });
    }

    const shipping = parsed.data.shipping;
    const userId = parsed.data.user_id;
    const sessionUserId = Number(sessionUser.id);

    if (userId !== sessionUserId) {
      logApiWarn({ requestId, route: "POST /api/shipping", message: "Vi phạm quyền sở hữu" });
      return unauthorized("Bạn không có quyền lưu địa chỉ cho người dùng khác", {
        requestId,
      });
    }

    const now = new Date().toISOString();
    const inserted = await db
      .insert(addresses)
      .values({
        userId,
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        phoneNumber: shipping.phoneNumber,
        state: shipping.state,
        city: shipping.city,
        zipCode: shipping.zipCode,
        address: shipping.address,
        country: shipping.country,
        createdAt: now,
      })
      .returning();

    const row = inserted[0];

    return ok({
      _id: String(row.id),
      firstName: row.firstName,
      lastName: row.lastName,
      city: row.city,
      country: row.country,
      zipCode: row.zipCode,
      address: row.address,
      phoneNumber: row.phoneNumber,
      state: row.state,
      message: "Đã lưu địa chỉ thành công",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/shipping",
      message: "Không thể lưu địa chỉ",
      error,
    });
    return serverError("Không thể lưu địa chỉ", { requestId });
  }
}
