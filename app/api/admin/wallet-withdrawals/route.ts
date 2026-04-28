import { desc, eq, sql } from "drizzle-orm";
import { badRequest, forbidden, ok, serverError } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/api-auth";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { users, wallets, walletTransactions, walletWithdrawRequests } from "@/lib/schema";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const admin = await requireAdminUser();
    if (!admin?.id) {
      return forbidden("Chỉ dành cho Quản trị viên", { requestId });
    }

    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get("status") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));

    const where = status ? eq(walletWithdrawRequests.status, status) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: walletWithdrawRequests.id,
          userId: walletWithdrawRequests.userId,
          transactionId: walletWithdrawRequests.transactionId,
          amountRequested: walletWithdrawRequests.amountRequested,
          feeAmount: walletWithdrawRequests.feeAmount,
          amountNet: walletWithdrawRequests.amountNet,
          bankName: walletWithdrawRequests.bankName,
          bankAccount: walletWithdrawRequests.bankAccount,
          accountHolder: walletWithdrawRequests.accountHolder,
          status: walletWithdrawRequests.status,
          rejectReason: walletWithdrawRequests.rejectReason,
          reviewedBy: walletWithdrawRequests.reviewedBy,
          reviewedAt: walletWithdrawRequests.reviewedAt,
          createdAt: walletWithdrawRequests.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(walletWithdrawRequests)
        .leftJoin(users, eq(walletWithdrawRequests.userId, users.id))
        .where(where)
        .orderBy(desc(walletWithdrawRequests.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: sql<number>`count(*)` })
        .from(walletWithdrawRequests)
        .where(where),
    ]);

    const total = Number(countRows[0]?.total || 0);

    return ok({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/admin/wallet-withdrawals",
      message: "Không thể tải danh sách yêu cầu rút tiền",
      error,
    });

    return serverError("Không thể tải danh sách yêu cầu rút tiền", { requestId });
  }
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const admin = await requireAdminUser();
    if (!admin?.id) {
      return forbidden("Chỉ dành cho Quản trị viên", { requestId });
    }

    const body = await request.json();
    const requestIdNumber = Number(body?.id);
    const action = String(body?.action || "").trim().toLowerCase();
    const rejectReason = String(body?.rejectReason || "").trim();

    if (!Number.isFinite(requestIdNumber)) {
      return badRequest("ID yêu cầu rút tiền không hợp lệ", { requestId });
    }

    if (action !== "approve" && action !== "reject") {
      return badRequest("Action không hợp lệ", { requestId });
    }

    const nowIso = new Date().toISOString();

    const rows = await db
      .select()
      .from(walletWithdrawRequests)
      .where(eq(walletWithdrawRequests.id, requestIdNumber));

    const target = rows[0];
    if (!target) {
      return badRequest("Không tìm thấy yêu cầu rút tiền", { requestId });
    }

    if (target.status !== "pending") {
      return badRequest("Yêu cầu này đã được xử lý trước đó", { requestId });
    }

    await db.transaction(async (tx) => {
      if (action === "approve") {
        await tx
          .update(walletWithdrawRequests)
          .set({
            status: "approved",
            rejectReason: null,
            reviewedBy: Number(admin.id),
            reviewedAt: nowIso,
            updatedAt: nowIso,
          })
          .where(eq(walletWithdrawRequests.id, requestIdNumber));

        await tx
          .update(walletTransactions)
          .set({
            status: "completed",
            updatedAt: nowIso,
          })
          .where(eq(walletTransactions.id, target.transactionId));

        return;
      }

      const txRows = await tx
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.id, target.transactionId));

      const walletTx = txRows[0];
      const refundAmount = Math.abs(Number(walletTx?.amount || target.amountRequested));

      let walletRows = await tx.select().from(wallets).where(eq(wallets.userId, target.userId));
      if (walletRows.length === 0) {
        await tx.insert(wallets).values({
          userId: target.userId,
          balance: 0,
          updatedAt: nowIso,
        });
        walletRows = await tx.select().from(wallets).where(eq(wallets.userId, target.userId));
      }

      const wallet = walletRows[0];
      const currentBalance = Number(wallet?.balance || 0);

      await tx
        .update(wallets)
        .set({
          balance: Number((currentBalance + refundAmount).toFixed(2)),
          updatedAt: nowIso,
        })
        .where(eq(wallets.id, wallet.id));

      if (walletTx) {
        await tx
          .update(walletTransactions)
          .set({
            status: "failed",
            updatedAt: nowIso,
          })
          .where(eq(walletTransactions.id, walletTx.id));
      }

      await tx.insert(walletTransactions).values({
        userId: target.userId,
        type: `withdraw_refund:${target.id}`,
        amount: refundAmount,
        status: "completed",
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await tx
        .update(walletWithdrawRequests)
        .set({
          status: "rejected",
          rejectReason: rejectReason || "Admin từ chối yêu cầu rút tiền",
          reviewedBy: Number(admin.id),
          reviewedAt: nowIso,
          updatedAt: nowIso,
        })
        .where(eq(walletWithdrawRequests.id, requestIdNumber));
    });

    return ok({
      message: action === "approve" ? "Đã duyệt yêu cầu rút tiền" : "Đã từ chối yêu cầu rút tiền",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "PATCH /api/admin/wallet-withdrawals",
      message: "Không thể xử lý yêu cầu rút tiền",
      error,
    });

    return serverError("Không thể xử lý yêu cầu rút tiền", { requestId });
  }
}

