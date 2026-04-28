export const runtime = 'edge';

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";
import { users } from "@/lib/schema";
import { verifyAndConsumeOtp } from "@/lib/otp-verify";

export async function PUT(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({ requestId, route: "PUT /api/account/profile", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const body = await request.json();
    const id = Number(body?.id);
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    const otpCode = String(body?.otpCode || "").trim();

    if (!Number.isFinite(id) || !name || !email) {
      return badRequest("Thiếu thông tin cập nhật", { requestId });
    }

    const sessionUserId = Number(sessionUser.id);
    if (!Number.isFinite(sessionUserId) || sessionUserId !== id) {
      logApiWarn({
        requestId,
        route: "PUT /api/account/profile",
        message: "Vi phạm quyền sở hữu ID người dùng",
      });
      return unauthorized("Bạn không có quyền cập nhật hồ sơ này", { requestId });
    }

    const duplicateEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, id)));

    if (duplicateEmail.length > 0) {
      return badRequest("Email đã được sử dụng", { requestId });
    }

    const updateData: {
      name: string;
      email: string;
      updatedAt: string;
      password?: string;
    } = {
      name,
      email,
      updatedAt: new Date().toISOString(),
    };

    if (password.length > 0) {
      if (!otpCode) {
        return badRequest("Đổi mật khẩu yêu cầu OTP xác thực", { requestId });
      }

      const sessionEmail = String(sessionUser.email || "").trim().toLowerCase();
      const otpResult = await verifyAndConsumeOtp({
        email: sessionEmail,
        code: otpCode,
        purpose: "change_password",
      });

      if (!otpResult.ok) {
        return badRequest(otpResult.message, { requestId });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    return ok({
      message: "Cập nhật thông tin thành công",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "PUT /api/account/profile",
      message: "Không thể cập nhật thông tin người dùng",
      error,
    });
    return serverError("Không thể cập nhật thông tin người dùng", { requestId });
  }
}
