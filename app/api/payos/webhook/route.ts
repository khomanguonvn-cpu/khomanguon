export const runtime = 'edge';

import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, wallets, walletTransactions } from "@/lib/schema";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { verifyPayOSWebhookSignature } from "@/lib/payos";
import { getRequestId, logApiError } from "@/lib/observability";

function extractSignature(body: Record<string, unknown>) {
  const directSignature = body?.signature;
  const directChecksum = body?.checksum;

  if (typeof directSignature === "string") {
    return directSignature;
  }

  if (typeof directChecksum === "string") {
    return directChecksum;
  }

  const nested = body?.data as Record<string, unknown> | undefined;
  const nestedSignature = nested?.signature;
  const nestedChecksum = nested?.checksum;

  if (typeof nestedSignature === "string") {
    return nestedSignature;
  }

  if (typeof nestedChecksum === "string") {
    return nestedChecksum;
  }

  return null;
}

function isPaidPayload(payload: Record<string, unknown>) {
  const code = String(payload?.code || "").trim();
  const status = String(payload?.status || "").trim().toUpperCase();
  const success = payload?.success === true;
  return code === "00" || status === "PAID" || success;
}

async function processOrderPayment(payosOrderCode: string, isPaid: boolean) {
  const rows = await db.select().from(orders).where(eq(orders.payosOrderCode, payosOrderCode));
  const target = rows[0];
  if (!target) {
    return { handled: false as const, message: "Không tìm thấy đơn hàng" };
  }

  const nextStatus = isPaid ? "paid" : "failed";

  if (target.paymentStatus === "paid" && nextStatus !== "paid") {
    return { handled: true as const, message: "Bỏ qua webhook đơn hàng (đã paid trước đó)" };
  }

  if (target.paymentStatus !== nextStatus) {
    await db
      .update(orders)
      .set({ paymentStatus: nextStatus })
      .where(eq(orders.id, target.id));
  }

  return { handled: true as const, message: "Đã xử lý trạng thái đơn hàng" };
}

async function processWalletDeposit(payosOrderCode: string, isPaid: boolean) {
  const rows = await db
    .select()
    .from(walletTransactions)
    .where(
      and(
        eq(walletTransactions.payosOrderCode, payosOrderCode),
        like(walletTransactions.type, "deposit:%")
      )
    );

  const target = rows[0];
  if (!target) {
    return { handled: false as const, message: "Không tìm thấy giao dịch nạp ví" };
  }

  const nextStatus = isPaid ? "completed" : "failed";

  if (target.status === "completed" && nextStatus !== "completed") {
    return { handled: true as const, message: "Bỏ qua webhook nạp ví (đã completed trước đó)" };
  }

  if (target.status === nextStatus) {
    return { handled: true as const, message: "Webhook nạp ví trùng, bỏ qua" };
  }

  const nowIso = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx
      .update(walletTransactions)
      .set({ status: nextStatus, updatedAt: nowIso })
      .where(eq(walletTransactions.id, target.id));

    if (nextStatus !== "completed") {
      return;
    }

    const walletRows = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, target.userId));

    if (walletRows.length === 0) {
      await tx.insert(wallets).values({
        userId: target.userId,
        balance: target.amount,
        updatedAt: nowIso,
      });
      return;
    }

    const currentWallet = walletRows[0];
    await tx
      .update(wallets)
      .set({
        balance: Number((currentWallet.balance + target.amount).toFixed(2)),
        updatedAt: nowIso,
      })
      .where(eq(wallets.id, currentWallet.id));
  });

  return { handled: true as const, message: "Đã xử lý giao dịch nạp ví" };
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const body = (await request.json()) as Record<string, unknown>;
    const payload = ((body?.data as Record<string, unknown>) ||
      body) as Record<string, unknown>;
    const signature = extractSignature(body);

    const isVerified = await verifyPayOSWebhookSignature(payload, signature);
    if (!isVerified) {
      return badRequest("Webhook signature không hợp lệ", { requestId });
    }

    const payosOrderCode = payload?.orderCode ? String(payload.orderCode) : "";
    if (!payosOrderCode) {
      return badRequest("Thiếu orderCode", { requestId });
    }

    const isPaid = isPaidPayload(payload);

    const orderResult = await processOrderPayment(payosOrderCode, isPaid);
    const walletResult = await processWalletDeposit(payosOrderCode, isPaid);

    if (!orderResult.handled && !walletResult.handled) {
      return badRequest("Không tìm thấy đơn hàng hoặc giao dịch nạp ví", { requestId });
    }

    return ok({
      message: "Webhook PayOS đã được xử lý",
      order: orderResult,
      walletDeposit: walletResult,
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/payos/webhook",
      message: "Không thể xử lý webhook PayOS",
      error,
    });

    return serverError("Không thể xử lý webhook PayOS", { requestId });
  }
}
