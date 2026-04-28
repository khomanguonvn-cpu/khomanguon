export const runtime = 'edge';

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { slides } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { ok, badRequest, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const data = await db.select().from(slides).orderBy(slides.sortOrder, desc(slides.id));
    return ok({ data });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/slides", message: "Thất bại", error });
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { slug, title, subtitle, btn, link, image, textColor, sortOrder } = body;
    const now = new Date().toISOString();

    await db.insert(slides).values({
      slug: slug || "banner-home",
      title: title || "",
      subtitle: subtitle || "",
      btn: btn || "",
      link: link || "",
      image: image || "",
      textColor: textColor || "#ffffff",
      sortOrder: sortOrder || 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "POST /api/admin/slides", message: "Thất bại", error });
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
    if (fields.slug !== undefined) updateData.slug = fields.slug;
    if (fields.title !== undefined) updateData.title = fields.title;
    if (fields.subtitle !== undefined) updateData.subtitle = fields.subtitle;
    if (fields.btn !== undefined) updateData.btn = fields.btn;
    if (fields.link !== undefined) updateData.link = fields.link;
    if (fields.image !== undefined) updateData.image = fields.image;
    if (fields.textColor !== undefined) updateData.textColor = fields.textColor;
    if (fields.sortOrder !== undefined) updateData.sortOrder = fields.sortOrder;
    if (fields.isActive !== undefined) updateData.isActive = fields.isActive;

    await db.update(slides).set(updateData).where(eq(slides.id, id));
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "PATCH /api/admin/slides", message: "Thất bại", error });
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

    await db.delete(slides).where(eq(slides.id, parseInt(id)));
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "DELETE /api/admin/slides", message: "Thất bại", error });
    return serverError();
  }
}
