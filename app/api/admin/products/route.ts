
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sellerProducts } from "@/lib/schema";
import { requireAdminUser } from "@/lib/api-auth";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền truy cập");
    }

    const products = await db
      .select()
      .from(sellerProducts)
      .orderBy(sellerProducts.createdAt);

    return ok({ data: products, requestId });
  } catch (error) {
    logApiError({ requestId, route: "GET /api/admin/products", message: "Không thể lấy danh sách sản phẩm", error });
    return serverError("Không thể lấy danh sách sản phẩm", { requestId });
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền xóa sản phẩm");
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return badRequest("Thiếu tham số id", { requestId });
    }

    const productId = Number(idParam);
    if (!Number.isFinite(productId)) {
      return badRequest("ID sản phẩm không hợp lệ", { requestId });
    }

    const existing = await db
      .select()
      .from(sellerProducts)
      .where(eq(sellerProducts.id, productId));

    if (existing.length === 0) {
      return notFound("Không tìm thấy sản phẩm", { requestId });
    }

    await db
      .delete(sellerProducts)
      .where(eq(sellerProducts.id, productId));

    return ok({
      message: "Đã xóa sản phẩm thành công",
      deletedId: productId,
      requestId,
    });
  } catch (error) {
    logApiError({ requestId, route: "DELETE /api/admin/products", message: "Không thể xóa sản phẩm", error });
    return serverError("Không thể xóa sản phẩm", { requestId });
  }
}
