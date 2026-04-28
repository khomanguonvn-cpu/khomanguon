
import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api-response";
import { getRequestId, logApiError } from "@/lib/observability";
import { getSiteConfig } from "@/lib/site-config";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const data = await getSiteConfig();
    return ok({ data });
  } catch (error) {
    logApiError({
      requestId: reqId,
      route: "GET /api/site-config",
      message: "Thất bại",
      error,
    });
    return serverError();
  }
}
