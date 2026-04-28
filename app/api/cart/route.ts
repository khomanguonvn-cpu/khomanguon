export const runtime = 'edge';

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts } from "@/lib/schema";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({
        requestId,
        route: "GET /api/cart",
        message: "Truy cập trái phép",
      });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get("user_id")?.trim();

    if (!rawUserId) {
      logApiWarn({
        requestId,
        route: "GET /api/cart",
        message: "Thiếu ID người dùng",
      });
      return badRequest("Thiếu user_id", { requestId });
    }

    const userId = Number(rawUserId);
    const sessionUserId = Number(sessionUser.id);

    if (!Number.isFinite(userId) || userId <= 0) {
      return badRequest("user_id không hợp lệ: " + rawUserId, { requestId });
    }

    if (userId !== sessionUserId) {
      logApiWarn({
        requestId,
        route: "GET /api/cart",
        message: "Vi phạm quyền sở hữu",
      });
      return unauthorized("Bạn không có quyền truy cập giỏ hàng này", { requestId });
    }

    const rows = await db.select().from(carts).where(eq(carts.userId, userId));
    if (rows.length === 0) {
      const now = new Date().toISOString();
      await db.insert(carts).values({
        userId,
        cartTotal: 0,
        productsJson: "[]",
        updatedAt: now,
      });
    }

    const cart = (await db.select().from(carts).where(eq(carts.userId, userId)))[0];

    return ok({
      data: {
        cartTotal: cart.cartTotal,
        products: JSON.parse(cart.productsJson),
        deliveryInfo: undefined,
        shippingAddress: undefined,
      },
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/cart",
      message: "Không thể lấy giỏ hàng",
      error,
    });
    return serverError("Không thể lấy giỏ hàng", { requestId });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const body = await request.json();
    const rawUserId = body?.user_id;
    const userId = Number(rawUserId);
    const products = Array.isArray(body?.products) ? body.products : [];
    const cartTotal = Number(body?.cart_total || 0);

    if (!Number.isFinite(userId) || userId <= 0) {
      return badRequest("user_id không hợp lệ: " + String(rawUserId), { requestId });
    }

    const sessionUserId = Number(sessionUser.id);
    if (userId !== sessionUserId) {
      return unauthorized("Bạn không có quyền cập nhật giỏ hàng này", { requestId });
    }

    const now = new Date().toISOString();
    const existing = await db.select().from(carts).where(eq(carts.userId, userId));

    if (existing.length === 0) {
      await db.insert(carts).values({
        userId,
        cartTotal,
        productsJson: JSON.stringify(products),
        updatedAt: now,
      });
    } else {
      await db
        .update(carts)
        .set({
          cartTotal,
          productsJson: JSON.stringify(products),
          updatedAt: now,
        })
        .where(eq(carts.userId, userId));
    }

    return ok({ message: "Lưu giỏ hàng thành công", requestId });
  } catch (error) {
    return serverError("Không thể cập nhật giỏ hàng", {
      requestId,
      error: String(error),
    });
  }
}
