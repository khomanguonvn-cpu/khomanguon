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

    console.log("[Wallet Deposit Webhook] Incoming body:", JSON.stringify(body, null, 2));

    const payload = ((body?.data as Record<string, unknown>) ||
      body) as Record<string, unknown>;
    const signature = extractSignature(body);

    if (!(await verifyPayOSWebhookSignature(payload, signature))) {
      console.error("[Wallet Deposit Webhook] Signature verification FAILED!", {
        requestId,
        payloadKeys: Object.keys(payload),
        orderCode: payload?.orderCode,
      });
      // MUST return 200 - PayOS marks webhook as broken if it receives non-2xx
      return ok({ message: "Webhook signature không hợp lệ", requestId });
    }

    console.log("[Wallet Deposit Webhook] Signature verified OK");

    const payosOrderCode = payload?.orderCode ? String(payload.orderCode) : "";
    // FIX: Check root-level code (body.code) which is where PayOS puts the status
    const rootCode = String(body?.code ?? "").trim();
    const dataCode = String(payload?.code ?? "").trim();

    if (!payosOrderCode) {
      return ok({ message: "Thiếu orderCode (có thể là webhook test)", requestId });
    }

    const txRows = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.payosOrderCode, payosOrderCode));

    const targetTx = txRows[0];
    if (!targetTx) {
      console.error("[Wallet Deposit Webhook] Transaction not found for orderCode:", payosOrderCode);
      return ok({ message: "Không tìm thấy giao dịch nạp", requestId });
    }

    // FIX: Check both root-level and data-level fields for payment status
    const isPaid =
      rootCode === "00" ||
      dataCode === "00" ||
      String(payload?.status ?? "").toUpperCase() === "PAID" ||
      payload?.success === true ||
      body?.success === true;

    console.log("[Wallet Deposit Webhook] Payment status check:", {
      rootCode,
      dataCode,
      payloadStatus: payload?.status,
      isPaid,
      txId: targetTx.id,
      userId: targetTx.userId,
      amount: targetTx.amount,
      currentStatus: targetTx.status,
    });

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
        console.log("[Wallet Deposit Webhook] Marked as failed, no balance update", {
          txId: targetTx.id,
          userId: targetTx.userId,
        });
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
        console.log("[Wallet Deposit Webhook] Created new wallet:", {
          userId: targetTx.userId,
          balance: targetTx.amount,
        });
        return;
      }

      const current = walletRows[0];
      const newBalance = Number((current.balance + targetTx.amount).toFixed(2));
      await tx
        .update(wallets)
        .set({
          balance: newBalance,
          updatedAt: nowIso,
        })
        .where(eq(wallets.id, current.id));

      console.log("[Wallet Deposit Webhook] Updated wallet balance:", {
        userId: targetTx.userId,
        previousBalance: current.balance,
        depositAmount: targetTx.amount,
        newBalance,
      });
    });

    return ok({ message: "Webhook nạp tiền vào ví đã được xử lý", requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/wallet/deposit/webhook",
      message: "Không thể xử lý webhook nạp tiền",
      error,
    });
    console.error("[Wallet Deposit Webhook] UNHANDLED ERROR:", error);
    return serverError("Không thể xử lý webhook nạp tiền", { requestId });
  }
}
