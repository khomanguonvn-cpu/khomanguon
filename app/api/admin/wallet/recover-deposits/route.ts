
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { wallets, walletTransactions } from "@/lib/schema";
import { eq, like, and } from "drizzle-orm";
import { ok, forbidden, serverError, badRequest } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";
import { getPayOSConfig } from "@/lib/payos-config";

/**
 * POST /api/admin/wallet/recover-deposits
 *
 * Admin-only endpoint to recover stuck deposit transactions.
 * Finds all "pending" deposit wallet transactions and:
 *   - Checks with PayOS if the payment was actually completed
 *   - If completed, credits the wallet and marks transaction as "completed"
 *
 * Body (optional):
 *   { "dryRun": true }  — just list stuck transactions without processing
 *   { "txIds": [1,2,3] } — only process specific transaction IDs
 */
export async function POST(request: NextRequest) {
  const reqId = getRequestId(request);

  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return forbidden("Chỉ dành cho Quản trị viên");
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;
    const filterTxIds: number[] | null = Array.isArray(body?.txIds) ? body.txIds : null;

    // Find all pending deposit transactions
    const pendingRows = await db
      .select()
      .from(walletTransactions)
      .where(
        and(
          like(walletTransactions.type, "deposit:%"),
          eq(walletTransactions.status, "pending")
        )
      );

    const targetRows = filterTxIds
      ? pendingRows.filter((r) => filterTxIds.includes(r.id))
      : pendingRows;

    if (targetRows.length === 0) {
      return ok({
        message: "Không có giao dịch nạp pending nào cần xử lý",
        processed: 0,
        total: 0,
      });
    }

    // If dryRun, just return the list
    if (dryRun) {
      return ok({
        message: `Tìm thấy ${targetRows.length} giao dịch nạp pending`,
        dryRun: true,
        transactions: targetRows.map((r) => ({
          id: r.id,
          userId: r.userId,
          amount: r.amount,
          type: r.type,
          payosOrderCode: r.payosOrderCode,
          createdAt: r.createdAt,
        })),
      });
    }

    // Load PayOS config for API calls
    const payosConfig = await getPayOSConfig();
    const hasPayOSApi = !!(payosConfig.clientId && payosConfig.apiKey);

    const results: Array<{
      txId: number;
      userId: number;
      amount: number;
      payosOrderCode: string | null;
      action: string;
      payosStatus?: string;
      error?: string;
    }> = [];

    const nowIso = new Date().toISOString();

    for (const tx of targetRows) {
      try {
        let shouldCredit = false;
        let payosStatus = "unknown";

        // Try to verify with PayOS API if we have credentials
        if (hasPayOSApi && tx.payosOrderCode) {
          try {
            const checkUrl = `https://api-merchant.payos.vn/v2/payment-requests/${tx.payosOrderCode}`;
            const response = await fetch(checkUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-client-id": payosConfig.clientId,
                "x-api-key": payosConfig.apiKey,
              },
              signal: AbortSignal.timeout(10000),
            });

            if (response.ok) {
              const json = await response.json();
              const data = json?.data || json;
              payosStatus = String(data?.status || json?.code || "unknown");

              // PayOS returns status "PAID" or code "00" for successful payments
              if (
                payosStatus === "PAID" ||
                String(json?.code) === "00" ||
                data?.status === "PAID"
              ) {
                shouldCredit = true;
                payosStatus = "PAID";
              } else {
                payosStatus = data?.status || `code:${json?.code}`;
              }
            } else {
              payosStatus = `http_${response.status}`;
            }
          } catch (fetchErr) {
            payosStatus = `fetch_error: ${String(fetchErr).slice(0, 100)}`;
          }
        } else {
          // No PayOS API access - skip automatic verification
          payosStatus = "no_api_credentials";
        }

        if (!shouldCredit) {
          results.push({
            txId: tx.id,
            userId: tx.userId,
            amount: tx.amount,
            payosOrderCode: tx.payosOrderCode,
            action: "skipped",
            payosStatus,
          });
          continue;
        }

        // Credit the wallet
        await db.transaction(async (dbTx) => {
          // Update transaction status
          await dbTx
            .update(walletTransactions)
            .set({ status: "completed", updatedAt: nowIso })
            .where(eq(walletTransactions.id, tx.id));

          // Get or create wallet
          const walletRows = await dbTx
            .select()
            .from(wallets)
            .where(eq(wallets.userId, tx.userId));

          if (walletRows.length === 0) {
            await dbTx.insert(wallets).values({
              userId: tx.userId,
              balance: tx.amount,
              updatedAt: nowIso,
            });
          } else {
            const current = walletRows[0];
            const newBalance = Number(
              (current.balance + tx.amount).toFixed(2)
            );
            await dbTx
              .update(wallets)
              .set({ balance: newBalance, updatedAt: nowIso })
              .where(eq(wallets.id, current.id));
          }
        });

        results.push({
          txId: tx.id,
          userId: tx.userId,
          amount: tx.amount,
          payosOrderCode: tx.payosOrderCode,
          action: "credited",
          payosStatus,
        });

        console.log("[RecoverDeposit] Credited wallet:", {
          txId: tx.id,
          userId: tx.userId,
          amount: tx.amount,
          payosOrderCode: tx.payosOrderCode,
        });
      } catch (txErr) {
        results.push({
          txId: tx.id,
          userId: tx.userId,
          amount: tx.amount,
          payosOrderCode: tx.payosOrderCode,
          action: "error",
          error: String(txErr).slice(0, 200),
        });
      }
    }

    const credited = results.filter((r) => r.action === "credited").length;
    const skipped = results.filter((r) => r.action === "skipped").length;
    const errored = results.filter((r) => r.action === "error").length;

    return ok({
      message: `Đã xử lý ${targetRows.length} giao dịch: ${credited} đã cộng tiền, ${skipped} bỏ qua, ${errored} lỗi`,
      total: targetRows.length,
      credited,
      skipped,
      errored,
      results,
    });
  } catch (error) {
    logApiError({
      requestId: reqId,
      route: "POST /api/admin/wallet/recover-deposits",
      message: "Lỗi recover deposits",
      error,
    });
    return serverError("Lỗi xử lý recover deposits");
  }
}
