export const runtime = 'edge';

import { and, eq } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { walletTransactions } from "@/lib/schema";
import { createPayOSPaymentLink } from "@/lib/payos";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createOrderCode() {
  const ts = Number(String(Date.now()).slice(-8));
  const rand = Math.floor(Math.random() * 899999) + 100000;
  return ts * 1000000 + rand;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({ requestId, route: "POST /api/wallet/deposit", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const userId = Number(sessionUser.id);
    const body = await request.json();

    const amount = Number(body?.amount);
    const idempotencyKey = String(body?.idempotencyKey || createIdempotencyKey()).trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return badRequest("Số tiền nạp không hợp lệ", { requestId });
    }

    if (amount < 10000) {
      return badRequest("Số tiền nạp tối thiểu là 10.000đ", { requestId });
    }

    const roundedAmount = Math.round(amount);
    if (roundedAmount < 1000) {
      return badRequest("Số tiền nạp phải lớn hơn 1.000đ sau khi làm tròn", { requestId });
    }

    const existingRows = await db
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.userId, userId),
          eq(walletTransactions.type, `deposit:${idempotencyKey}`)
        )
      );

    const existing = existingRows[0];
    if (existing) {
      return ok({
        message: "Yêu cầu nạp đã tồn tại",
        checkoutUrl: existing.payosCheckoutUrl || null,
        transactionId: String(existing.id),
        requestId,
      });
    }

    const nowIso = new Date().toISOString();
    const orderCode = createOrderCode();

    const returnUrlFromBody = String(body?.returnUrl || "").trim();
    const returnUrl =
      returnUrlFromBody ||
      process.env.PAYOS_RETURN_URL ||
      `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/account/wallet`;
    const cancelUrl = process.env.PAYOS_CANCEL_URL || returnUrl;

    const payosRes = await createPayOSPaymentLink({
      orderCode,
      amount: roundedAmount,
      description: `WALLET-${userId}`,
      returnUrl,
      cancelUrl,
      items: [
        {
          name: "Nạp ví",
          quantity: 1,
          price: roundedAmount,
        },
      ],
    });

    if (!payosRes.checkoutUrl || !payosRes.paymentLinkId) {
      return badRequest(
        `Không thể tạo link nạp tiền PayOS: ${String(payosRes.error || "Lỗi không xác định")}`,
        {
          requestId,
          payos: payosRes.raw || null,
        }
      );
    }

    const insertedRows = await db
      .insert(walletTransactions)
      .values({
        userId,
        type: `deposit:${idempotencyKey}`,
        amount,
        status: "pending",
        payosOrderCode: String(orderCode),
        payosPaymentLinkId: payosRes.paymentLinkId,
        payosCheckoutUrl: payosRes.checkoutUrl,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .returning();

    const inserted = insertedRows[0];

    return ok({
      message: "Đã tạo yêu cầu nạp tiền qua PayOS",
      checkoutUrl: payosRes.checkoutUrl,
      transactionId: String(inserted.id),
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/wallet/deposit",
      message: "Không thể tạo yêu cầu nạp tiền",
      error,
    });
    return serverError("Không thể tạo yêu cầu nạp tiền", { requestId });
  }
}
