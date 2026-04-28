import { eq } from "drizzle-orm";
import { ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { systemConfigs } from "@/lib/schema";
import { getRequestId } from "@/lib/observability";

const WITHDRAW_FEE_CONFIG_KEY = "withdraw_fee_percent";
const DEFAULT_WITHDRAW_FEE_PERCENT = 1;

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
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_WITHDRAW_FEE_PERCENT;
}

export async function GET() {
  const requestId = getRequestId(new Request("http://localhost"));

  try {
    await ensureDatabaseReady();
    const feePercent = await getWithdrawFeePercent();
    return ok({ data: { feePercent }, requestId });
  } catch (error) {
    return serverError("Không thể lấy cấu hình phí rút tiền", { requestId });
  }
}
