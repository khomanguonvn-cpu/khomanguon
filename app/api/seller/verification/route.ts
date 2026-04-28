
import { eq } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { sellerProfiles } from "@/lib/schema";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const userId = Number(sessionUser.id);
    const rows = await db.select().from(sellerProfiles).where(eq(sellerProfiles.userId, userId));

    const seller = rows[0] || null;
    const rawStatus = String(seller?.kycStatus || "").toLowerCase();

    // Normalize status: admin may set "verified" but we want "approved"
    let status: "not_submitted" | "pending" | "approved" | "rejected" = "not_submitted";
    if (rawStatus === "verified" || rawStatus === "approved") {
      status = "approved";
    } else if (rawStatus === "pending") {
      status = "pending";
    } else if (rawStatus === "rejected") {
      status = "rejected";
    }

    return ok({
      data: {
        status,
        isVerified: status === "approved",
        showUnverifiedWarning: status !== "approved",
      },
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/seller/verification",
      message: "Không thể lấy trạng thái xác minh người bán",
      error,
    });
    return serverError("Không thể lấy trạng thái xác minh người bán", { requestId });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const userId = Number(sessionUser.id);
    const nowIso = new Date().toISOString();

    const rows = await db.select().from(sellerProfiles).where(eq(sellerProfiles.userId, userId));

    if (rows.length > 0) {
      return ok({ message: "Bạn đã đăng ký người bán", requestId });
    }

    await db.insert(sellerProfiles).values({
      userId,
      ratingAverage: 5,
      ratingCount: 0,
      disputeCount: 0,
      kycStatus: "pending",
      canSell: false,
      updatedAt: nowIso,
    });

    return ok({ message: "Đăng ký người bán thành công", requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/seller/verification",
      message: "Không thể đăng ký người bán",
      error,
    });
    return serverError("Không thể đăng ký người bán", { requestId });
  }
}
