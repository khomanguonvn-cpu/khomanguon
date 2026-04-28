
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  escrowTransactions,
  wallets,
  walletTransactions,
} from "@/lib/schema";
import { ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";

export async function GET(request: Request) {
  try {
    await ensureDatabaseReady();

    // Optional: simple auth via header or query param for cron security
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get("secret")?.trim();
    const expectedSecret = process.env.CRON_SECRET || "";

    if (expectedSecret && cronSecret !== expectedSecret) {
      return new Response("Không có quyền truy cập", { status: 401 });
    }

    const nowIso = new Date().toISOString();

    // Find order items that are pending and past the auto-refund deadline
    const expiredItems = await db
      .select()
      .from(orderItems)
      .where(
        and(
          eq(orderItems.fulfillmentStatus, "pending"),
          lt(orderItems.autoRefundAt, nowIso)
        )
      );

    if (expiredItems.length === 0) {
      return ok({ message: "Không có đơn hàng nào cần hoàn tiền", refunded: 0 });
    }

    let refundedCount = 0;

    for (const item of expiredItems) {
      try {
        await db.transaction(async (tx) => {
          // Mark as auto_refunded
          await tx
            .update(orderItems)
            .set({
              fulfillmentStatus: "auto_refunded",
              updatedAt: nowIso,
            })
            .where(eq(orderItems.id, item.id));

          const refundAmount = Number(item.price) * Number(item.qty);

          // Refund to buyer wallet
          const walletRows = await tx
            .select()
            .from(wallets)
            .where(eq(wallets.userId, item.buyerId));

          if (walletRows.length > 0) {
            const currentBalance = Number(walletRows[0].balance);
            await tx
              .update(wallets)
              .set({
                balance: Number((currentBalance + refundAmount).toFixed(2)),
                updatedAt: nowIso,
              })
              .where(eq(wallets.userId, item.buyerId));
          } else {
            // Create wallet if not exists
            await tx.insert(wallets).values({
              userId: item.buyerId,
              balance: refundAmount,
              updatedAt: nowIso,
            });
          }

          // Create refund transaction record
          await tx.insert(walletTransactions).values({
            userId: item.buyerId,
            type: "auto_refund",
            amount: refundAmount,
            status: "success",
            createdAt: nowIso,
            updatedAt: nowIso,
          });

          // Update escrow if exists
          const escrowRows = await tx
            .select()
            .from(escrowTransactions)
            .where(
              and(
                eq(escrowTransactions.orderId, item.orderId),
                eq(escrowTransactions.status, "held")
              )
            );

          if (escrowRows.length > 0) {
            await tx
              .update(escrowTransactions)
              .set({
                status: "refunded",
                settledAt: nowIso,
                updatedAt: nowIso,
              })
              .where(eq(escrowTransactions.id, escrowRows[0].id));
          }
        });

        refundedCount += 1;
      } catch (itemError) {
        console.error(
          `[auto-refund] Thất bại hoàn tiền order_item ${item.id}:`,
          itemError
        );
      }
    }

    return ok({
      message: `Đã hoàn tiền ${refundedCount}/${expiredItems.length} đơn hàng quá hạn`,
      refunded: refundedCount,
      total: expiredItems.length,
    });
  } catch (error) {
    return serverError("Không thể chạy auto-refund", {
      error: String(error),
    });
  }
}
