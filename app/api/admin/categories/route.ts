import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { productCategories, productSubcategories, sellerProducts } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ok, badRequest, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const categories = await db.select().from(productCategories).orderBy(productCategories.sortOrder, desc(productCategories.id));
    const subcategories = await db.select().from(productSubcategories).orderBy(productSubcategories.sortOrder, desc(productSubcategories.id));

    const data = categories.map(cat => ({
      ...cat,
      subcategories: subcategories.filter(sub => sub.categoryId === cat.id),
    }));

    return ok({ data });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/categories", message: "Thất bại", error });
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { name, slug, description, sortOrder } = body;
    if (!name || !slug) return badRequest("Thiếu tên hoặc đường dẫn (slug)");

    const now = new Date().toISOString();
    await db.insert(productCategories).values({
      name, slug, description: description || "", sortOrder: sortOrder || 0,
      isActive: true, createdAt: now, updatedAt: now,
    });

    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "POST /api/admin/categories", message: "Thất bại", error });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { id, type, ...fields } = body;
    if (!id) return badRequest("Thiếu ID");

    const now = new Date().toISOString();

    if (type === "subcategory") {
      const updateData: Record<string, any> = { updatedAt: now };
      if (fields.name !== undefined) updateData.name = fields.name;
      if (fields.slug !== undefined) updateData.slug = fields.slug;
      if (fields.description !== undefined) updateData.description = fields.description;
      if (fields.sortOrder !== undefined) updateData.sortOrder = fields.sortOrder;
      if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
      if (fields.listingMode !== undefined) updateData.listingMode = fields.listingMode;
      await db.update(productSubcategories).set(updateData).where(eq(productSubcategories.id, id));
    } else {
      const updateData: Record<string, any> = { updatedAt: now };
      if (fields.name !== undefined) updateData.name = fields.name;
      if (fields.slug !== undefined) updateData.slug = fields.slug;
      if (fields.description !== undefined) updateData.description = fields.description;
      if (fields.sortOrder !== undefined) updateData.sortOrder = fields.sortOrder;
      if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
      await db.update(productCategories).set(updateData).where(eq(productCategories.id, id));
    }

    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "PATCH /api/admin/categories", message: "Thất bại", error });
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

    const categoryId = parseInt(id);

    // Delete subcategories for this category
    const subs = await db.select({ id: productSubcategories.id }).from(productSubcategories).where(eq(productSubcategories.categoryId, categoryId));
    if (subs.length > 0) {
      const subIds = subs.map(s => s.id);
      // Delete products in these subcategories
      for (const subId of subIds) {
        await db.delete(sellerProducts).where(eq(sellerProducts.subcategoryId, subId));
      }
      await db.delete(productSubcategories).where(eq(productSubcategories.categoryId, categoryId));
    }

    await db.delete(productCategories).where(eq(productCategories.id, categoryId));
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "DELETE /api/admin/categories", message: "Thất bại", error });
    return serverError();
  }
}
