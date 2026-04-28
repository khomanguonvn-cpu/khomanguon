import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, users, sellerProducts, kycSubmissions } from "@/lib/schema";
import { sql, eq } from "drizzle-orm";
import { ok, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const [orderStats, userStats, productStats, kycStats] = await Promise.all([
      db.select({
        total: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        pending: sql<number>`sum(case when ${orders.shippingStatus} = 'pending' then 1 else 0 end)`,
      }).from(orders),
      db.select({ total: sql<number>`count(*)` }).from(users),
      db.select({ total: sql<number>`count(*)` }).from(sellerProducts),
      db.select({ total: sql<number>`count(*)` }).from(kycSubmissions).where(eq(kycSubmissions.status, "pending")),
    ]);

    return ok({
      data: {
        totalOrders: orderStats[0]?.total || 0,
        totalRevenue: orderStats[0]?.revenue || 0,
        totalUsers: userStats[0]?.total || 0,
        totalProducts: productStats[0]?.total || 0,
        pendingKyc: kycStats[0]?.total || 0,
        pendingOrders: orderStats[0]?.pending || 0,
      }
    });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/stats", message: "Thất bại", error });
    return serverError();
  }
}
