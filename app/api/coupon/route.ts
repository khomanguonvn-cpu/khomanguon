import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts, coupons } from "@/lib/schema";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { requireSessionUser } from "@/lib/api-auth";
import { couponApplySchema, zodDetails } from "@/lib/validators";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser) {
      logApiWarn({ requestId, route: "POST /api/coupon", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const body = await request.json();
    const parsed = couponApplySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dữ liệu mã giảm giá không hợp lệ", {
        requestId,
        fields: zodDetails(parsed.error),
      });
    }

    const code = parsed.data.coupon.trim().toUpperCase();
    const userId = parsed.data.user;
    const sessionUserId = Number(sessionUser.id);

    if (userId !== sessionUserId) {
      logApiWarn({ requestId, route: "POST /api/coupon", message: "Vi phạm quyền sở hữu" });
      return unauthorized("Bạn không có quyền áp dụng coupon cho người dùng khác", {
        requestId,
      });
    }

    const couponRows = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, code), eq(coupons.active, true)));

    const coupon = couponRows[0];
    if (!coupon) {
      logApiWarn({ requestId, route: "POST /api/coupon", message: "Mã giảm giá không hợp lệ" });
      return ok({ data: null, message: "Mã giảm giá không hợp lệ", requestId });
    }

    const cartRows = await db.select().from(carts).where(eq(carts.userId, userId));
    const cart = cartRows[0];

    if (!cart) {
      return badRequest("Không tìm thấy giỏ hàng", { requestId });
    }

    const totalAfterDiscount = Number(
      (cart.cartTotal - (cart.cartTotal * coupon.discountPercent) / 100).toFixed(2)
    );

    return ok({
      message: "Áp dụng mã giảm giá thành công",
      coupon: coupon.code,
      discount: coupon.discountPercent,
      totalAfterDiscount,
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/coupon",
      message: "Không thể áp dụng mã giảm giá",
      error,
    });
    return serverError("Không thể áp dụng mã giảm giá", { requestId });
  }
}
