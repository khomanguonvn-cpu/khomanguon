import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { hashOtp, isExpired } from "@/lib/otp";
import { otpCodes } from "@/lib/schema";

const MAX_VERIFY_ATTEMPTS = 5;

export type OtpPurpose =
  | "email_verify"
  | "password_reset"
  | "change_password"
  | "bank_link"
  | "withdraw_request";

type VerifyOtpInput = {
  email: string;
  code: string;
  purpose: OtpPurpose;
};

type VerifyOtpResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export async function verifyAndConsumeOtp(input: VerifyOtpInput): Promise<VerifyOtpResult> {
  const email = input.email.trim().toLowerCase();
  const code = input.code.trim();
  const purpose = input.purpose;

  if (!email || !code) {
    return { ok: false, message: "Thiếu email hoặc mã OTP" };
  }

  const rows = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), eq(otpCodes.purpose, purpose), isNull(otpCodes.verifiedAt)))
    .orderBy(desc(otpCodes.createdAt));

  const active = rows[0];
  if (!active) {
    return { ok: false, message: "Không tìm thấy OTP hợp lệ. Vui lòng gửi lại OTP" };
  }

  if (active.attempts >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, message: "Bạn đã nhập sai OTP quá nhiều lần" };
  }

  if (isExpired(active.expiresAt)) {
    return { ok: false, message: "OTP đã hết hạn. Vui lòng gửi lại OTP" };
  }

  const nowIso = new Date().toISOString();
  const hashedInput = hashOtp(code);

  if (hashedInput !== active.codeHash) {
    await db
      .update(otpCodes)
      .set({
        attempts: active.attempts + 1,
        updatedAt: nowIso,
      })
      .where(eq(otpCodes.id, active.id));

    return { ok: false, message: "OTP không chính xác" };
  }

  await db
    .update(otpCodes)
    .set({
      verifiedAt: nowIso,
      updatedAt: nowIso,
    })
    .where(eq(otpCodes.id, active.id));

  return { ok: true };
}
