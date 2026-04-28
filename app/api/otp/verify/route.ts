
import { and, desc, eq, isNull } from "drizzle-orm";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { hashOtp, isExpired } from "@/lib/otp";
import { getRequestId, logApiError } from "@/lib/observability";
import { otpCodes, users } from "@/lib/schema";
import { otpVerifySchema, zodDetails } from "@/lib/validators";

const MAX_VERIFY_ATTEMPTS = 5;

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dữ liệu không hợp lệ", zodDetails(parsed.error));
    }

    const email = parsed.data.email.toLowerCase();
    const code = parsed.data.code;
    const purpose = parsed.data.purpose;

    const rows = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.email, email), eq(otpCodes.purpose, purpose), isNull(otpCodes.verifiedAt)))
      .orderBy(desc(otpCodes.createdAt));

    const active = rows[0];
    if (!active) {
      return badRequest("Không tìm thấy OTP hợp lệ");
    }

    if (active.attempts >= MAX_VERIFY_ATTEMPTS) {
      return badRequest("Bạn đã nhập sai quá nhiều lần");
    }

    if (isExpired(active.expiresAt)) {
      return badRequest("OTP đã hết hạn");
    }

    const hashedInput = hashOtp(code);
    const nowIso = new Date().toISOString();

    if (hashedInput !== active.codeHash) {
      await db
        .update(otpCodes)
        .set({ attempts: active.attempts + 1, updatedAt: nowIso })
        .where(eq(otpCodes.id, active.id));

      return badRequest("OTP không chính xác");
    }

    await db
      .update(otpCodes)
      .set({ verifiedAt: nowIso, updatedAt: nowIso })
      .where(eq(otpCodes.id, active.id));

    if (purpose === "email_verify") {
      await db
        .update(users)
        .set({ emailVerified: true, updatedAt: nowIso })
        .where(eq(users.email, email));
    }

    return ok({ message: "Xác thực OTP thành công", purpose });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/otp/verify",
      message: "Không thể xác thực OTP",
      error,
    });

    return serverError("Không thể xác thực OTP", { requestId });
  }
}
