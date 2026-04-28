
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { generateOtpCode, hashOtp } from "@/lib/otp";
import { getRequestId, logApiError } from "@/lib/observability";
import { otpCodes, users } from "@/lib/schema";
import { otpSendSchema, zodDetails } from "@/lib/validators";

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const RESEND_MAX_IN_5_MIN = 3;

const AUTH_REQUIRED_PURPOSES = new Set(["change_password", "bank_link", "withdraw_request"]);
const OTP_PURPOSE_LABEL: Record<
  "email_verify" | "password_reset" | "change_password" | "bank_link" | "withdraw_request",
  string
> = {
  email_verify: "xác thực tài khoản",
  password_reset: "khôi phục mật khẩu",
  change_password: "đổi mật khẩu",
  bank_link: "liên kết ngân hàng",
  withdraw_request: "xác nhận rút tiền",
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const body = await request.json();
    const parsed = otpSendSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dữ liệu không hợp lệ", zodDetails(parsed.error));
    }

    const email = parsed.data.email.toLowerCase();
    const purpose = parsed.data.purpose;

    if (AUTH_REQUIRED_PURPOSES.has(purpose)) {
      const sessionUser = await requireSessionUser();
      const sessionEmail = String(sessionUser?.email || "").trim().toLowerCase();

      if (!sessionUser?.id || !sessionEmail) {
        return unauthorized("Bạn cần đăng nhập để gửi OTP cho thao tác này", { requestId });
      }

      if (sessionEmail !== email) {
        return unauthorized("Bạn không có quyền gửi OTP cho email này", { requestId });
      }
    }

    const matchedUsers = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (matchedUsers.length === 0) {
      return badRequest("Email chưa được đăng ký trên hệ thống");
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const fiveMinutesAgoIso = new Date(now - 5 * 60 * 1000).toISOString();

    const lastActiveOtp = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.email, email), eq(otpCodes.purpose, purpose), isNull(otpCodes.verifiedAt)))
      .orderBy(desc(otpCodes.createdAt));

    const recentSends = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.purpose, purpose),
          gte(otpCodes.createdAt, fiveMinutesAgoIso)
        )
      );

    if (recentSends.length >= RESEND_MAX_IN_5_MIN) {
      return badRequest("Bạn đã gửi OTP quá nhiều lần. Vui lòng thử lại sau.");
    }

    if (lastActiveOtp.length > 0) {
      const cooldownUntil = new Date(lastActiveOtp[0].resendAvailableAt).getTime();
      if (cooldownUntil > now) {
        return badRequest("Vui lòng chờ trước khi gửi lại OTP.");
      }
    }

    const code = generateOtpCode();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(now + OTP_TTL_MINUTES * 60 * 1000).toISOString();
    const resendAvailableAt = new Date(now + RESEND_COOLDOWN_SECONDS * 1000).toISOString();

    await db.insert(otpCodes).values({
      email,
      purpose,
      codeHash,
      expiresAt,
      attempts: 0,
      sendCount: 1,
      windowStartedAt: nowIso,
      resendAvailableAt,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    const purposeLabel = OTP_PURPOSE_LABEL[purpose];

    if (resend) {
      const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      await resend.emails.send({
        from,
        to: email,
        subject: `Mã OTP ${purposeLabel}`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #fff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/assets/images/logo.svg"
         alt="Logo"
         style="height: 48px; margin-bottom: 8px;" />
    <h2 style="margin: 0; font-size: 20px; color: #1a1a1a;">KHOMANGUON</h2>
  </div>
  <div style="border-top: 1px solid #eee; padding-top: 24px;">
    <p style="font-size: 16px; color: #333; margin: 0 0 16px;">Xin chào,</p>
    <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
      Mã OTP của bạn là:
    </p>
    <p style="font-size: 32px; font-weight: bold; text-align: center; color: #4f46e5; margin: 24px 0; padding: 16px;
       background: #f5f3ff; border-radius: 8px; letter-spacing: 8px;">
      ${code}
    </p>
    <p style="font-size: 14px; color: #666; margin: 0 0 8px;">
      Mã dùng cho thao tác: <strong>${purposeLabel}</strong>
    </p>
    <p style="font-size: 14px; color: #666; margin: 0 0 24px;">
      Mã có hiệu lực trong <strong>${OTP_TTL_MINUTES} phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
      Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
    </p>
  </div>
</div>`,
      });
    } else {
      console.log(`[OTP_DEV][${purpose}] ${email}: ${code}`);
    }

    return ok({
      message: `Đã gửi OTP cho thao tác ${purposeLabel}`,
      purpose,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      expiresInMinutes: OTP_TTL_MINUTES,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/otp/send",
      message: "Không thể gửi OTP",
      error,
    });

    return serverError("Không thể gửi OTP", { requestId });
  }
}
