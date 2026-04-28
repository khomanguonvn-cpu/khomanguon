export const runtime = 'nodejs';

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { wallets, walletTransactions } from "@/lib/schema";
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

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const body = (await request.json()) as Record<string, unknown>;
    const payload = ((body?.data as Record<string, unknown>) ||
      body) as Record<string, unknown>;
    const signature = extractSignature(body);

    if (!(await verifyPayOSWebhookSignature(payload, signature))) {
      return badRequest("Webhook signature không hợp lệ", { requestId });
    }

    const payosOrderCode = payload?.orderCode ? String(payload.orderCode) : "";
    const code = String(payload?.code || "");

    if (!payosOrderCode) {
      return badRequest("Thiếu orderCode", { requestId });
    }

    const txRows = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.payosOrderCode, payosOrderCode));

    const targetTx = txRows[0];
    if (!targetTx) {
      return badRequest("Không tìm thấy giao dịch nạp", { requestId });
    }

    const isPaid =
      code === "00" || payload?.status === "PAID" || payload?.success === true;

    const nextStatus = isPaid ? "completed" : "failed";

    if (targetTx.status === "completed" && nextStatus !== "completed") {
      return ok({ message: "Đã bỏ qua webhook (đã thành công)", requestId });
    }

    if (targetTx.status === nextStatus) {
      return ok({ message: "Đã bỏ qua webhook bị trùng", requestId });
    }

    const nowIso = new Date().toISOString();

    await db.transaction(async (tx) => {
      await tx
        .update(walletTransactions)
        .set({ status: nextStatus, updatedAt: nowIso })
        .where(eq(walletTransactions.id, targetTx.id));

      if (nextStatus !== "completed") {
        return;
      }

      const walletRows = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, targetTx.userId));

      if (walletRows.length === 0) {
        await tx.insert(wallets).values({
          userId: targetTx.userId,
          balance: targetTx.amount,
          updatedAt: nowIso,
        });
        return;
      }

      const current = walletRows[0];
      await tx
        .update(wallets)
        .set({
          balance: Number((current.balance + targetTx.amount).toFixed(2)),
          updatedAt: nowIso,
        })
        .where(eq(wallets.id, current.id));
    });

    return ok({ message: "Webhook nạp tiền vào ví đã được xử lý", requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/wallet/deposit/webhook",
      message: "Không thể xử lý webhook nạp tiền",
      error,
    });
    return serverError("Không thể xử lý webhook nạp tiền", { requestId });
  }
}
