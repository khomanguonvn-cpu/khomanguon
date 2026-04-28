import { eq } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { users, wallets, walletTransactions, walletWithdrawRequests, systemConfigs } from "@/lib/schema";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";
import { verifyAndConsumeOtp } from "@/lib/otp-verify";

const MIN_WITHDRAW_AMOUNT = 50000;
const DEFAULT_WITHDRAW_FEE_PERCENT = 1;
const WITHDRAW_FEE_CONFIG_KEY = "withdraw_fee_percent";

async function getWithdrawFeePercent(): Promise<number> {
  try {
    const rows = await db
      .select({ value: systemConfigs.value })
      .from(systemConfigs)
      .where(eq(systemConfigs.key, WITHDRAW_FEE_CONFIG_KEY))
      .limit(1);
    if (rows.length > 0) {
      const rawValue = rows[0].value;
      const parsed = parseFloat(rawValue);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) {
        console.log(`[withdraw] Đã tìm cấu hình phí trong DB: key="${WITHDRAW_FEE_CONFIG_KEY}", raw="${rawValue}", parsed=${parsed}%`);
        return parsed;
      } else {
        console.warn(`[withdraw] Cấu hình phí không hợp lệ: raw="${rawValue}", falling back to default ${DEFAULT_WITHDRAW_FEE_PERCENT}%`);
      }
    } else {
      console.warn(`[withdraw] Không tìm thấy cấu hình phí trong DB (key="${WITHDRAW_FEE_CONFIG_KEY}"), using default ${DEFAULT_WITHDRAW_FEE_PERCENT}%`);
    }
  } catch (err) {
    console.error(`[withdraw] Không thể đọc cấu hình phí từ DB:`, err);
  }
  return DEFAULT_WITHDRAW_FEE_PERCENT;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({ requestId, route: "POST /api/wallet/withdraw", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const userId = Number(sessionUser.id);
    if (!Number.isFinite(userId)) {
      return badRequest("Người dùng không hợp lệ", { requestId });
    }

    const body = await request.json();
    const amount = Number(body?.amount);
    const otpCode = String(body?.otpCode || "").trim();
    let bankAccount = String(body?.bankAccount || "").trim();
    let bankName = String(body?.bankName || "").trim();
    let accountHolder = String(body?.accountHolder || "").trim();

    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      return badRequest("Số tiền rút không hợp lệ", { requestId });
    }

    if (amount < MIN_WITHDRAW_AMOUNT) {
      return badRequest(`Số tiền rút tối thiểu là ${MIN_WITHDRAW_AMOUNT.toLocaleString("vi-VN")}₫`, {
        requestId,
      });
    }

    const nowIso = new Date().toISOString();
    let walletRows = await db.select().from(wallets).where(eq(wallets.userId, userId));

    if (walletRows.length === 0) {
      await db.insert(wallets).values({
        userId,
        balance: 0,
        updatedAt: nowIso,
      });
      walletRows = await db.select().from(wallets).where(eq(wallets.userId, userId));
    }

    const availableBalance = Number(walletRows[0]?.balance || 0);
    if (amount > availableBalance) {
      return badRequest(
        `Số dư không đủ để rút tiền. Số dư hiện tại: ${availableBalance.toLocaleString("vi-VN")}₫`,
        { requestId }
      );
    }

    if (!bankAccount || !bankName || !accountHolder) {
      const userRows = await db
        .select({
          bankName: users.bankName,
          bankAccount: users.bankAccount,
          bankAccountHolder: users.bankAccountHolder,
        })
        .from(users)
        .where(eq(users.id, userId));

      const savedBank = userRows[0];
      if (savedBank) {
        bankName = bankName || savedBank.bankName || "";
        bankAccount = bankAccount || savedBank.bankAccount || "";
        accountHolder = accountHolder || savedBank.bankAccountHolder || "";
      }
    }

    if (!bankAccount || !bankName || !accountHolder) {
      return badRequest(
        "Thông tin tài khoản ngân hàng không hợp lệ. Vui lòng nhập hoặc lưu trước trong Hồ sơ",
        { requestId }
      );
    }

    if (!otpCode) {
      return badRequest("Rút tiền yêu cầu OTP xác thực", { requestId });
    }

    const sessionEmail = String(sessionUser.email || "").trim().toLowerCase();
    const otpResult = await verifyAndConsumeOtp({
      email: sessionEmail,
      code: otpCode,
      purpose: "withdraw_request",
    });

    if (!otpResult.ok) {
      return badRequest(otpResult.message, { requestId });
    }

    const withdrawFeePercent = await getWithdrawFeePercent();
    const fee = Number(((amount * withdrawFeePercent) / 100).toFixed(2));
    const amountNet = Number((amount - fee).toFixed(2));
    let createdWithdrawRequestId = 0;

    await db.transaction(async (tx) => {
      let walletRows = await tx.select().from(wallets).where(eq(wallets.userId, userId));

      if (walletRows.length === 0) {
        await tx.insert(wallets).values({
          userId,
          balance: 0,
          updatedAt: nowIso,
        });

        walletRows = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      }

      const wallet = walletRows[0];
      if (!wallet || wallet.balance < amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const nextBalance = Number((wallet.balance - amount).toFixed(2));
      await tx
        .update(wallets)
        .set({
          balance: nextBalance,
          updatedAt: nowIso,
        })
        .where(eq(wallets.id, wallet.id));

      const insertedTxRows = await tx
        .insert(walletTransactions)
        .values({
          userId,
          type: `withdraw_request:${Date.now()}`,
          amount: -amount,
          status: "pending",
          createdAt: nowIso,
          updatedAt: nowIso,
        })
        .returning({ id: walletTransactions.id });

      const walletTx = insertedTxRows[0];
      const insertedRequestRows = await tx
        .insert(walletWithdrawRequests)
        .values({
          userId,
          transactionId: walletTx.id,
          amountRequested: amount,
          feeAmount: fee,
          amountNet,
          bankName,
          bankAccount,
          accountHolder,
          status: "pending",
          createdAt: nowIso,
          updatedAt: nowIso,
        })
        .returning({ id: walletWithdrawRequests.id });

      createdWithdrawRequestId = insertedRequestRows[0].id;
    });

    logApiWarn({
      requestId,
      route: "POST /api/wallet/withdraw",
      message: "Yêu cầu rút tiền mới",
      meta: { userId, amount, bankName, withdrawRequestId: createdWithdrawRequestId },
    });

    return ok({
      message: `Yêu cầu rút tiền ${amountNet.toLocaleString("vi-VN")}₫ đã gửi, admin sẽ duyệt thủ công. Phí rút: ${fee.toLocaleString("vi-VN")}₫`,
      withdrawRequestId: createdWithdrawRequestId,
      requestId,
    });
  } catch (error) {
    if ((error as Error)?.message === "INSUFFICIENT_BALANCE") {
      return badRequest("Số dư ví không đủ để rút tiền", { requestId });
    }

    logApiError({
      requestId,
      route: "POST /api/wallet/withdraw",
      message: "Không thể xử lý yêu cầu rút tiền",
      error,
    });
    return serverError("Không thể xử lý yêu cầu rút tiền", { requestId });
  }
}
