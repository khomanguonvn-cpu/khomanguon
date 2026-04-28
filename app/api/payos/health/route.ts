
import { ok, unauthorized } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/api-auth";
import { getPayOSCircuitBreakerSnapshot } from "@/lib/payos";

export async function GET() {
  const adminUser = await requireAdminUser();

  if (!adminUser) {
    return unauthorized("Bạn không có quyền truy cập endpoint này");
  }

  const snapshot = getPayOSCircuitBreakerSnapshot();
  return ok({ data: snapshot });
}
