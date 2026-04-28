import { desc, eq } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { userBankAccounts, users, wallets, walletTransactions, walletWithdrawRequests } from "@/lib/schema";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({ requestId, route: "GET /api/wallet", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const userId = Number(sessionUser.id);
    if (!Number.isFinite(userId)) {
      return badRequest("Người dùng không hợp lệ", { requestId });
    }

    const nowIso = new Date().toISOString();
    const walletRows = await db.select().from(wallets).where(eq(wallets.userId, userId));

    if (walletRows.length === 0) {
      await db.insert(wallets).values({
        userId,
        balance: 0,
        updatedAt: nowIso,
      });
    }

    const wallet = (await db.select().from(wallets).where(eq(wallets.userId, userId)))[0];
    const userRows = await db
      .select({
        bankName: users.bankName,
        bankAccount: users.bankAccount,
        bankAccountHolder: users.bankAccountHolder,
      })
      .from(users)
      .where(eq(users.id, userId));

    const legacyBankInfo = userRows[0] || {
      bankName: "",
      bankAccount: "",
      bankAccountHolder: "",
    };

    const bankAccountRows = await db
      .select({
        id: userBankAccounts.id,
        bankName: userBankAccounts.bankName,
        bankAccount: userBankAccounts.bankAccount,
        bankAccountHolder: userBankAccounts.bankAccountHolder,
        isDefault: userBankAccounts.isDefault,
      })
      .from(userBankAccounts)
      .where(eq(userBankAccounts.userId, userId))
      .orderBy(desc(userBankAccounts.isDefault), desc(userBankAccounts.createdAt));

    const defaultBank = bankAccountRows.find((item) => item.isDefault) || bankAccountRows[0] || null;
    const bankInfo = defaultBank || legacyBankInfo;

    const transactions = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));

    // Fetch withdrawal requests for enrichment
    const withdrawRequestRows = await db
      .select()
      .from(walletWithdrawRequests)
      .where(eq(walletWithdrawRequests.userId, userId));

    // Map withdrawRequestId -> withdrawRequest for O(1) lookup
    const withdrawRequestMap = new Map<number, (typeof withdrawRequestRows)[0]>();
    for (const wr of withdrawRequestRows) {
      withdrawRequestMap.set(wr.transactionId, wr);
    }

    return ok({
      data: {
        balance: wallet.balance,
        email: String(sessionUser.email || "").trim().toLowerCase(),
        bankInfo: {
          ...bankInfo,
          isConfigured: Boolean(bankInfo.bankName && bankInfo.bankAccount && bankInfo.bankAccountHolder),
        },
        bankAccounts: bankAccountRows.map((item) => ({
          id: item.id,
          bankName: item.bankName,
          bankAccount: item.bankAccount,
          bankAccountHolder: item.bankAccountHolder,
          isDefault: Boolean(item.isDefault),
        })),
        transactions: transactions.map((item) => {
          // Enrich withdrawal transactions with details from walletWithdrawRequests
          const withdrawRequest = withdrawRequestMap.get(item.id);
          return {
            id: String(item.id),
            type: item.type,
            amount: item.amount,
            status: item.status,
            createdAt: item.createdAt,
            // Withdrawal-specific details (only present if this tx is linked to a withdrawal)
            bankName: withdrawRequest?.bankName || null,
            bankAccount: withdrawRequest?.bankAccount || null,
            accountHolder: withdrawRequest?.accountHolder || null,
            feeAmount: withdrawRequest?.feeAmount || null,
            amountNet: withdrawRequest?.amountNet || null,
            rejectReason: withdrawRequest?.rejectReason || null,
          };
        }),
      },
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/wallet",
      message: "Không thể lấy dữ liệu ví",
      error,
    });
    return serverError("Không thể lấy dữ liệu ví", { requestId });
  }
}
