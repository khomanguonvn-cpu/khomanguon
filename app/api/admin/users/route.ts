export const runtime = 'edge';

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { ok, badRequest, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const banned = searchParams.get("banned") || "";

    const conditions = [];
    if (search) {
      conditions.push(sql`(${like(users.name, `%${search}%`)} OR ${like(users.email, `%${search}%`)})`);
    }
    if (role) conditions.push(eq(users.role, role));
    if (banned === "true") conditions.push(eq(users.isBanned, true));
    else if (banned === "false") conditions.push(eq(users.isBanned, false));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset((page - 1) * limit),
      db.select({ count: sql<number>`count(*)` }).from(users).where(where),
    ]);

    const total = countResult[0]?.count || 0;
    return ok({ data, pagination: { page, totalPages: Math.ceil(total / limit), total, limit } });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/users", message: "Thất bại", error });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { id, action, role } = body;
    if (!id || !action) return badRequest("Thiếu ID hoặc hành động");

    if (action === "ban") {
      await db.update(users).set({ isBanned: true, updatedAt: new Date().toISOString() }).where(eq(users.id, id));
    } else if (action === "unban") {
      await db.update(users).set({ isBanned: false, updatedAt: new Date().toISOString() }).where(eq(users.id, id));
    } else if (action === "role") {
      if (!role) return badRequest("Thiếu quyền (role)");
      await db.update(users).set({ role, updatedAt: new Date().toISOString() }).where(eq(users.id, id));
    } else {
      return badRequest("Hành động không hợp lệ");
    }

    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "PATCH /api/admin/users", message: "Thất bại", error });
    return serverError();
  }
}
