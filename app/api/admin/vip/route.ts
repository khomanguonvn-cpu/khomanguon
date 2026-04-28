export const runtime = 'edge';

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vipTiers } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { ok, badRequest, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const data = await db.select().from(vipTiers).orderBy(desc(vipTiers.createdAt));
    return ok({ data });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/vip", message: "Thất bại", error });
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { name, price, discountPercent, durationDays } = body;
    if (!name || price === undefined || discountPercent === undefined || durationDays === undefined) {
      return badRequest("Thiếu các trường bắt buộc");
    }

    const now = new Date().toISOString();
    await db.insert(vipTiers).values({ name, price, discountPercent, durationDays, active: true, createdAt: now, updatedAt: now });
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "POST /api/admin/vip", message: "Thất bại", error });
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

    const now = new Date().toISOString();
    const updateData: Record<string, any> = { updatedAt: now };
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.price !== undefined) updateData.price = fields.price;
    if (fields.discountPercent !== undefined) updateData.discountPercent = fields.discountPercent;
    if (fields.durationDays !== undefined) updateData.durationDays = fields.durationDays;
    if (fields.active !== undefined) updateData.active = fields.active;

    await db.update(vipTiers).set(updateData).where(eq(vipTiers.id, id));
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "PATCH /api/admin/vip", message: "Thất bại", error });
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

    await db.delete(vipTiers).where(eq(vipTiers.id, parseInt(id)));
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "DELETE /api/admin/vip", message: "Thất bại", error });
    return serverError();
  }
}
