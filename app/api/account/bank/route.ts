import { and, desc, eq } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";
import { verifyAndConsumeOtp } from "@/lib/otp-verify";
import { userBankAccounts, users } from "@/lib/schema";

async function getBankAccountsByUserId(userId: number) {
  return db
    .select({
      id: userBankAccounts.id,
      bankName: userBankAccounts.bankName,
      bankAccount: userBankAccounts.bankAccount,
      bankAccountHolder: userBankAccounts.bankAccountHolder,
      isDefault: userBankAccounts.isDefault,
      createdAt: userBankAccounts.createdAt,
      updatedAt: userBankAccounts.updatedAt,
    })
    .from(userBankAccounts)
    .where(eq(userBankAccounts.userId, userId))
    .orderBy(desc(userBankAccounts.isDefault), desc(userBankAccounts.createdAt));
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({ requestId, route: "GET /api/account/bank", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const userId = Number(sessionUser.id);
    if (!Number.isFinite(userId)) {
      return badRequest("Người dùng không hợp lệ", { requestId });
    }

    const userRows = await db
      .select({
        bankName: users.bankName,
        bankAccount: users.bankAccount,
        bankAccountHolder: users.bankAccountHolder,
      })
      .from(users)
      .where(eq(users.id, userId));

    const userInfo = userRows[0] || {
      bankName: "",
      bankAccount: "",
      bankAccountHolder: "",
    };

    const accounts = await getBankAccountsByUserId(userId);
    const defaultAccount = accounts.find((item) => item.isDefault) || accounts[0] || null;

    const effectiveBankName = defaultAccount?.bankName || userInfo.bankName || "";
    const effectiveBankAccount = defaultAccount?.bankAccount || userInfo.bankAccount || "";
    const effectiveBankAccountHolder =
      defaultAccount?.bankAccountHolder || userInfo.bankAccountHolder || "";

    return ok({
      data: {
        email: String(sessionUser.email || "").trim().toLowerCase(),
        bankName: effectiveBankName,
        bankAccount: effectiveBankAccount,
        bankAccountHolder: effectiveBankAccountHolder,
        isConfigured: Boolean(effectiveBankName && effectiveBankAccount && effectiveBankAccountHolder),
        accounts: accounts.map((item) => ({
          id: item.id,
          bankName: item.bankName,
          bankAccount: item.bankAccount,
          bankAccountHolder: item.bankAccountHolder,
          isDefault: Boolean(item.isDefault),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      },
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/account/bank",
      message: "Không thể lấy thông tin ngân hàng",
      error,
    });
    return serverError("Không thể lấy thông tin ngân hàng", { requestId });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({ requestId, route: "POST /api/account/bank", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const userId = Number(sessionUser.id);
    if (!Number.isFinite(userId)) {
      return badRequest("Người dùng không hợp lệ", { requestId });
    }

    const body = await request.json();
    const bankName = String(body?.bankName || "").trim();
    const bankAccount = String(body?.bankAccount || "").trim();
    const bankAccountHolder = String(body?.bankAccountHolder || "").trim();
    const otpCode = String(body?.otpCode || "").trim();
    const setDefault = Boolean(body?.setDefault);

    if (!bankName || !bankAccount || !bankAccountHolder) {
      return badRequest("Vui lòng nhập đầy đủ tên ngân hàng, số tài khoản và tên chủ tài khoản", {
        requestId,
      });
    }

    if (!otpCode) {
      return badRequest("Thêm ngân hàng yêu cầu OTP xác thực", { requestId });
    }

    const sessionEmail = String(sessionUser.email || "").trim().toLowerCase();
    const otpResult = await verifyAndConsumeOtp({
      email: sessionEmail,
      code: otpCode,
      purpose: "bank_link",
    });

    if (!otpResult.ok) {
      return badRequest(otpResult.message, { requestId });
    }

    const nowIso = new Date().toISOString();
    const existingAccount = await db
      .select({ id: userBankAccounts.id })
      .from(userBankAccounts)
      .where(and(eq(userBankAccounts.userId, userId), eq(userBankAccounts.bankAccount, bankAccount)));

    if (existingAccount.length > 0) {
      return badRequest("Số tài khoản này đã được lưu trước đó", { requestId });
    }

    const currentAccounts = await getBankAccountsByUserId(userId);
    const shouldSetDefault = setDefault || currentAccounts.length === 0;

    await db.transaction(async (tx) => {
      if (shouldSetDefault) {
        await tx
          .update(userBankAccounts)
          .set({ isDefault: false, updatedAt: nowIso })
          .where(eq(userBankAccounts.userId, userId));
      }

      await tx.insert(userBankAccounts).values({
        userId,
        bankName,
        bankAccount,
        bankAccountHolder,
        isDefault: shouldSetDefault,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      if (shouldSetDefault) {
        await tx
          .update(users)
          .set({
            bankName,
            bankAccount,
            bankAccountHolder,
            updatedAt: nowIso,
          })
          .where(eq(users.id, userId));
      }
    });

    return ok({
      message: "Đã lưu thông tin ngân hàng thành công",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/account/bank",
      message: "Không thể lưu thông tin ngân hàng",
      error,
    });
    return serverError("Không thể lưu thông tin ngân hàng", { requestId });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({ requestId, route: "PATCH /api/account/bank", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const userId = Number(sessionUser.id);
    if (!Number.isFinite(userId)) {
      return badRequest("Người dùng không hợp lệ", { requestId });
    }

    const body = await request.json();
    const action = String(body?.action || "").trim();
    const accountId = Number(body?.accountId || 0);

    if (action !== "set_default" || !Number.isFinite(accountId) || accountId <= 0) {
      return badRequest("Thao tác ngân hàng không hợp lệ", { requestId });
    }

    const matched = await db
      .select()
      .from(userBankAccounts)
      .where(and(eq(userBankAccounts.userId, userId), eq(userBankAccounts.id, accountId)));

    const target = matched[0];
    if (!target) {
      return badRequest("Không tìm thấy tài khoản ngân hàng cần cập nhật", { requestId });
    }

    const nowIso = new Date().toISOString();

    await db.transaction(async (tx) => {
      await tx
        .update(userBankAccounts)
        .set({ isDefault: false, updatedAt: nowIso })
        .where(eq(userBankAccounts.userId, userId));

      await tx
        .update(userBankAccounts)
        .set({ isDefault: true, updatedAt: nowIso })
        .where(eq(userBankAccounts.id, accountId));

      await tx
        .update(users)
        .set({
          bankName: target.bankName,
          bankAccount: target.bankAccount,
          bankAccountHolder: target.bankAccountHolder,
          updatedAt: nowIso,
        })
        .where(eq(users.id, userId));
    });

    return ok({
      message: "Đã cập nhật ngân hàng mặc định",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "PATCH /api/account/bank",
      message: "Không thể cập nhật ngân hàng mặc định",
      error,
    });
    return serverError("Không thể cập nhật ngân hàng mặc định", { requestId });
  }
}
