export const runtime = 'edge';

import bcrypt from "bcryptjs";
import { and, desc, eq, isNull } from "drizzle-orm";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { hashOtp, isExpired } from "@/lib/otp";
import { getRequestId, logApiError } from "@/lib/observability";
import { otpCodes, users } from "@/lib/schema";
import { passwordResetSchema, zodDetails } from "@/lib/validators";

const MAX_VERIFY_ATTEMPTS = 5;

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const body = await request.json();
    const parsed = passwordResetSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dữ liệu không hợp lệ", zodDetails(parsed.error));
    }

    const email = parsed.data.email.toLowerCase();
    const code = parsed.data.code;
    const newPassword = parsed.data.newPassword;

    const userRows = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    const targetUser = userRows[0];
    if (!targetUser) {
      return badRequest("Email chưa được đăng ký trên hệ thống", { requestId });
    }

    const otpRows = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.email, email), eq(otpCodes.purpose, "password_reset"), isNull(otpCodes.verifiedAt)))
      .orderBy(desc(otpCodes.createdAt));

    const active = otpRows[0];
    if (!active) {
      return badRequest("Không tìm thấy OTP hợp lệ. Vui lòng gửi lại OTP", { requestId });
    }

    if (active.attempts >= MAX_VERIFY_ATTEMPTS) {
      return badRequest("Bạn đã nhập sai OTP quá nhiều lần", { requestId });
    }

    if (isExpired(active.expiresAt)) {
      return badRequest("OTP đã hết hạn. Vui lòng gửi lại OTP", { requestId });
    }

    const nowIso = new Date().toISOString();
    const hashedInput = hashOtp(code);

    if (hashedInput !== active.codeHash) {
      await db
        .update(otpCodes)
        .set({ attempts: active.attempts + 1, updatedAt: nowIso })
        .where(eq(otpCodes.id, active.id));

      return badRequest("OTP không chính xác", { requestId });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(otpCodes)
      .set({ verifiedAt: nowIso, updatedAt: nowIso })
      .where(eq(otpCodes.id, active.id));

    await db
      .update(users)
      .set({
        password: passwordHash,
        emailVerified: true,
        updatedAt: nowIso,
      })
      .where(eq(users.id, targetUser.id));

    return ok({
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại ngay bây giờ",
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/password/reset",
      message: "Không thể đặt lại mật khẩu",
      error,
    });
    return serverError("Không thể đặt lại mật khẩu", { requestId });
  }
}
