import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { ok, badRequest, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const data = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return ok({ data });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/coupons", message: "Thất bại", error });
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { code, discountPercent } = body;
    if (!code || discountPercent === undefined) return badRequest("Thiếu mã code hoặc tỷ lệ giảm giá");

    const now = new Date().toISOString();
    await db.insert(coupons).values({ code: code.toUpperCase(), discountPercent, active: true, createdAt: now });
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "POST /api/admin/coupons", message: "Thất bại", error });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return badRequest("Thiếu ID");

    const updateData: Record<string, any> = {};
    if (fields.discountPercent !== undefined) updateData.discountPercent = fields.discountPercent;
    if (fields.active !== undefined) updateData.active = fields.active;
    if (fields.code !== undefined) updateData.code = fields.code;

    await db.update(coupons).set(updateData).where(eq(coupons.id, id));
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "PATCH /api/admin/coupons", message: "Thất bại", error });
    return serverError();
  }
}

export async function DELETE(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return badRequest("Thiếu ID");

    await db.delete(coupons).where(eq(coupons.id, parseInt(id)));
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "DELETE /api/admin/coupons", message: "Thất bại", error });
    return serverError();
  }
}
