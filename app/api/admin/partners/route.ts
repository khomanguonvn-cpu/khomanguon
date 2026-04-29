import { NextRequest } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerBrandLogos } from "@/lib/schema";
import { badRequest, forbidden, ok, serverError } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";
import {
  ensurePartnerBrandLogosTable,
  normalizePartnerLogoSortOrder,
  normalizePartnerLogoText,
} from "@/lib/partner-brand-logos";

async function requireAdmin() {
  const sessionUser = await requireSessionUser();
  return sessionUser?.role === "admin" ? sessionUser : null;
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return forbidden("Chỉ dành cho Quản trị viên", { requestId });
    }

    await ensurePartnerBrandLogosTable();

    const data = await db
      .select()
      .from(partnerBrandLogos)
      .orderBy(asc(partnerBrandLogos.sortOrder), desc(partnerBrandLogos.id));

    return ok({ data, requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/admin/partners",
      message: "Không thể tải logo đối tác",
      error,
    });
    return serverError("Không thể tải logo đối tác", { requestId });
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return forbidden("Chỉ dành cho Quản trị viên", { requestId });
    }

    await ensurePartnerBrandLogosTable();

    const body = await request.json();
    const name = normalizePartnerLogoText(body?.name);
    const logoUrl = normalizePartnerLogoText(body?.logoUrl);
    const link = normalizePartnerLogoText(body?.link);
    const sortOrder = normalizePartnerLogoSortOrder(body?.sortOrder);
    const now = new Date().toISOString();

    if (!name) {
      return badRequest("Vui lòng nhập tên đối tác", { requestId });
    }

    if (!logoUrl) {
      return badRequest("Vui lòng nhập hoặc upload logo", { requestId });
    }

    await db.insert(partnerBrandLogos).values({
      name,
      logoUrl,
      link,
      sortOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return ok({ success: true, requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/admin/partners",
      message: "Không thể thêm logo đối tác",
      error,
    });
    return serverError("Không thể thêm logo đối tác", { requestId });
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return forbidden("Chỉ dành cho Quản trị viên", { requestId });
    }

    await ensurePartnerBrandLogosTable();

    const body = await request.json();
    const id = Number(body?.id);

    if (!Number.isFinite(id) || id <= 0) {
      return badRequest("Thiếu ID logo đối tác", { requestId });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body?.name !== undefined) {
      updateData.name = normalizePartnerLogoText(body.name);
    }
    if (body?.logoUrl !== undefined) {
      updateData.logoUrl = normalizePartnerLogoText(body.logoUrl);
    }
    if (body?.link !== undefined) {
      updateData.link = normalizePartnerLogoText(body.link);
    }
    if (body?.sortOrder !== undefined) {
      updateData.sortOrder = normalizePartnerLogoSortOrder(body.sortOrder);
    }
    if (body?.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (updateData.name === "") {
      return badRequest("Tên đối tác không được để trống", { requestId });
    }

    if (updateData.logoUrl === "") {
      return badRequest("Logo không được để trống", { requestId });
    }

    await db.update(partnerBrandLogos).set(updateData).where(eq(partnerBrandLogos.id, id));

    return ok({ success: true, requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: "PATCH /api/admin/partners",
      message: "Không thể cập nhật logo đối tác",
      error,
    });
    return serverError("Không thể cập nhật logo đối tác", { requestId });
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return forbidden("Chỉ dành cho Quản trị viên", { requestId });
    }

    await ensurePartnerBrandLogosTable();

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isFinite(id) || id <= 0) {
      return badRequest("Thiếu ID logo đối tác", { requestId });
    }

    await db.delete(partnerBrandLogos).where(eq(partnerBrandLogos.id, id));

    return ok({ success: true, requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: "DELETE /api/admin/partners",
      message: "Không thể xóa logo đối tác",
      error,
    });
    return serverError("Không thể xóa logo đối tác", { requestId });
  }
}
