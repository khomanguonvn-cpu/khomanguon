export const runtime = 'nodejs';

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { ok, badRequest, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";

function isWalletPaymentMethod(value: unknown) {
  const method = String(value || "").trim().toLowerCase();
  return method === "wallet" || method === "wallet_balance" || method === "walletbalance";
}

function isOrderPaymentSettled(paymentStatus: unknown, paymentMethod: unknown) {
  return (
    String(paymentStatus || "").trim().toLowerCase() === "paid" ||
    isWalletPaymentMethod(paymentMethod)
  );
}

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const { searchParams } = new URL(request.url);
    const shippingStatus = searchParams.get("shippingStatus") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const conditions = [];
    if (shippingStatus) conditions.push(eq(orders.shippingStatus, shippingStatus));
    if (paymentStatus === "paid") {
      conditions.push(
        or(
          eq(orders.paymentStatus, "paid"),
          eq(orders.paymentMethod, "wallet"),
          eq(orders.paymentMethod, "wallet_balance"),
          eq(orders.paymentMethod, "walletbalance")
        )
      );
    } else if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countRows] = await Promise.all([
      db.select({
        id: orders.id,
        userId: orders.userId,
        productsJson: orders.productsJson,
        total: orders.total,
        totalBeforeDiscount: orders.totalBeforeDiscount,
        shippingStatus: orders.shippingStatus,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        shippingPrice: orders.shippingPrice,
        couponApplied: orders.couponApplied,
        createdAt: orders.createdAt,
        userName: users.name,
        userEmail: users.email,
      }).from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: sql<number>`count(*)` }).from(orders).where(where),
    ]);

    const total = countRows[0]?.total || 0;
    const mappedData = data.map((item) => {
      const isPaid = isOrderPaymentSettled(item.paymentStatus, item.paymentMethod);
      return {
        ...item,
        paymentStatus: isPaid ? "paid" : item.paymentStatus,
        isPaid,
      };
    });
    return ok({ data: mappedData, pagination: { page, totalPages: Math.ceil(total / limit), total, limit } });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/orders", message: "Thất bại", error });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { id, shippingStatus, paymentStatus } = body;
    if (!id) return badRequest("Thiếu ID");

    const updateData: Record<string, any> = {};
    if (shippingStatus !== undefined) updateData.shippingStatus = shippingStatus;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;

    if (Object.keys(updateData).length === 0) return badRequest("Không có gì để cập nhật");

    await db.update(orders).set(updateData).where(eq(orders.id, id));
    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "PATCH /api/admin/orders", message: "Thất bại", error });
    return serverError();
  }
}
