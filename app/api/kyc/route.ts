import { desc, eq } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { kycSubmissions, sellerProfiles } from "@/lib/schema";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const userId = Number(sessionUser.id);

    const rows = await db
      .select()
      .from(kycSubmissions)
      .where(eq(kycSubmissions.userId, userId))
      .orderBy(desc(kycSubmissions.createdAt));

    const latest = rows[0] || null;

    return ok({ data: latest, requestId });
  } catch (error) {
    logApiError({ requestId, route: "GET /api/kyc", message: "Không thể lấy KYC", error });
    return serverError("Không thể lấy KYC", { requestId });
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
    const body = await request.json();

    const fullName = String(body?.fullName || "").trim();
    const documentType = String(body?.documentType || "").trim();
    const documentNumber = String(body?.documentNumber || "").trim();
    const documentFrontUrl = String(body?.documentFrontUrl || "").trim();
    const documentBackUrl = body?.documentBackUrl ? String(body.documentBackUrl).trim() : null;
    const selfieUrl = body?.selfieUrl ? String(body.selfieUrl).trim() : null;

    if (!fullName || !documentType || !documentNumber || !documentFrontUrl) {
      return badRequest("Thiếu thông tin KYC bắt buộc", { requestId });
    }

    const nowIso = new Date().toISOString();

    await db.transaction(async (tx) => {
      await tx.insert(kycSubmissions).values({
        userId,
        fullName,
        documentType,
        documentNumber,
        documentFrontUrl,
        documentBackUrl,
        selfieUrl,
        status: "pending",
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const profileRows = await tx
        .select()
        .from(sellerProfiles)
        .where(eq(sellerProfiles.userId, userId));

      if (profileRows.length === 0) {
        await tx.insert(sellerProfiles).values({
          userId,
          ratingAverage: 5,
          ratingCount: 0,
          disputeCount: 0,
          kycStatus: "pending",
          canSell: true,
          updatedAt: nowIso,
        });
      } else {
        await tx
          .update(sellerProfiles)
          .set({ kycStatus: "pending", updatedAt: nowIso })
          .where(eq(sellerProfiles.userId, userId));
      }
    });

    logApiWarn({
      requestId,
      route: "POST /api/kyc",
      message: "Đã gửi hồ sơ KYC",
      meta: { userId },
    });

    return ok({ message: "Đã gửi KYC thành công", requestId });
  } catch (error) {
    logApiError({ requestId, route: "POST /api/kyc", message: "Không thể gửi KYC", error });
    return serverError("Không thể gửi KYC", { requestId });
  }
}
