import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, escrowTransactions, wallets, walletTransactions } from "@/lib/schema";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";

export async function PUT(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({
        requestId,
        route: "PUT /api/account/order",
        message: "Truy cập trái phép",
      });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const body = await request.json();
    const orderId = Number(body?.id);
    const userId = Number(body?.user);
    const sessionUserId = Number(sessionUser.id);

    if (!Number.isFinite(orderId) || !Number.isFinite(userId)) {
      return badRequest("Dữ liệu không hợp lệ", { requestId });
    }

    if (userId !== sessionUserId) {
      logApiWarn({
        requestId,
        route: "PUT /api/account/order",
        message: "Vi phạm quyền sở hữu",
      });
      return unauthorized("Bạn không có quyền hủy đơn hàng của người dùng khác", {
        requestId,
      });
    }

    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    const target = rows[0];
    if (!target) {
      return badRequest("Không tìm thấy đơn hàng", { requestId });
    }

    if (target.shippingStatus === "cancelled") {
      return ok({ message: "Đơn hàng đã được hủy trước đó", requestId });
    }

    // Cannot cancel orders that have been delivered or completed
    const normalizedStatus = String(target.shippingStatus || "").toLowerCase();
    if (normalizedStatus === "delivered" || normalizedStatus === "handed_over" || normalizedStatus === "completed") {
      return badRequest("Không thể hủy đơn hàng đã giao hoặc hoàn tất", { requestId });
    }

    const nowIso = new Date().toISOString();

    // Get escrow and order items for refund calculation
    const escrowRows = await db
      .select()
      .from(escrowTransactions)
      .where(and(eq(escrowTransactions.orderId, orderId)));

    const escrow = escrowRows[0];
    const escrowAmount = escrow ? Number(escrow.amount || 0) : 0;

    // Calculate refund based on fulfillment status
    let refundAmount = 0;

    if (escrowAmount > 0) {
      // Check if any items have been fulfilled
      const orderItemsRows = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const fulfilledItems = orderItemsRows.filter((item) => item.fulfillmentStatus === "fulfilled");
      const pendingItems = orderItemsRows.filter((item) => item.fulfillmentStatus === "pending");

      // Refund = escrow - (sum of fulfilled items * price * qty)
      const fulfilledAmount = fulfilledItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.qty),
        0
      );

      refundAmount = Math.max(0, escrowAmount - fulfilledAmount);
    }

    // Perform cancellation and refund in transaction
    await db.transaction(async (tx) => {
      // Update order status to cancelled
      await tx
        .update(orders)
        .set({ shippingStatus: "cancelled" })
        .where(eq(orders.id, orderId));

      // Update any pending order items to auto_refunded
      await tx
        .update(orderItems)
        .set({
          fulfillmentStatus: "auto_refunded",
          updatedAt: nowIso,
        })
        .where(and(eq(orderItems.orderId, orderId)));

      // Release or adjust escrow
      if (escrow) {
        if (refundAmount > 0) {
          // Partial refund: update escrow to refunded amount
          await tx
            .update(escrowTransactions)
            .set({
              status: "released",
              settledAt: nowIso,
              updatedAt: nowIso,
            })
            .where(eq(escrowTransactions.id, escrow.id));

          // Refund remaining amount to buyer's wallet
          const buyerWalletRows = await tx
            .select()
            .from(wallets)
            .where(eq(wallets.userId, userId));

          if (buyerWalletRows[0]) {
            await tx
              .update(wallets)
              .set({
                balance: Number((buyerWalletRows[0].balance + refundAmount).toFixed(2)),
                updatedAt: nowIso,
              })
              .where(eq(wallets.id, buyerWalletRows[0].id));
          } else {
            await tx.insert(wallets).values({
              userId,
              balance: refundAmount,
              updatedAt: nowIso,
            });
          }

          // Record wallet transaction
          await tx.insert(walletTransactions).values({
            userId,
            type: "refund",
            amount: refundAmount,
            status: "success",
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        } else {
          // No refund needed (all items fulfilled) - just release escrow
          await tx
            .update(escrowTransactions)
            .set({
              status: "released",
              settledAt: nowIso,
              updatedAt: nowIso,
            })
            .where(eq(escrowTransactions.id, escrow.id));
        }
      }
    });

    if (refundAmount > 0) {
      const formatted = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(refundAmount);

      return ok({
        message: `Hủy đơn hàng thành công. ${formatted} đã được hoàn vào ví của bạn.`,
        requestId,
      });
    }

    return ok({
      message: "Hủy đơn hàng thành công",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "PUT /api/account/order",
      message: "Không thể hủy đơn hàng",
      error,
    });
    return serverError("Không thể hủy đơn hàng", { requestId });
  }
}
