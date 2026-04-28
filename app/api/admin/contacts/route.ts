export const runtime = 'edge';

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";
import { ok, serverError, forbidden } from "@/lib/api-response";
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

    const [data, countResult] = await Promise.all([
      db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(limit).offset((page - 1) * limit),
      db.select({ count: sql<number>`count(*)` }).from(contactMessages),
    ]);

    const total = countResult[0]?.count || 0;
    return ok({ data, pagination: { page, totalPages: Math.ceil(total / limit), total, limit } });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/contacts", message: "Thất bại", error });
    return serverError();
  }
}
