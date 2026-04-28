
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { kycSubmissions, users, sellerProfiles } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { ok, badRequest, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";
import { extractObjectKeyFromUrl, deleteR2Objects } from "@/lib/r2";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const conditions = [];
    if (status) conditions.push(eq(kycSubmissions.status, status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: kycSubmissions.id,
        userId: kycSubmissions.userId,
        fullName: kycSubmissions.fullName,
        documentType: kycSubmissions.documentType,
        documentNumber: kycSubmissions.documentNumber,
        documentFrontUrl: kycSubmissions.documentFrontUrl,
        documentBackUrl: kycSubmissions.documentBackUrl,
        selfieUrl: kycSubmissions.selfieUrl,
        status: kycSubmissions.status,
        adminNote: kycSubmissions.adminNote,
        reviewedBy: kycSubmissions.reviewedBy,
        reviewedAt: kycSubmissions.reviewedAt,
        createdAt: kycSubmissions.createdAt,
        userName: users.name,
        userEmail: users.email,
      }).from(kycSubmissions)
        .leftJoin(users, eq(kycSubmissions.userId, users.id))
        .where(where)
        .orderBy(desc(kycSubmissions.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: sql<number>`count(*)` }).from(kycSubmissions).where(where),
    ]);

    const total = countResult[0]?.count || 0;
    return ok({ data, pagination: { page, totalPages: Math.ceil(total / limit), total, limit } });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/kyc", message: "Thất bại", error });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { id, action, adminNote } = body;
    if (!id || !action) return badRequest("Thiếu ID hoặc hành động");

    const now = new Date().toISOString();
    const newStatus = action === "approve" ? "approved" : "rejected";

    const [submission] = await db
      .select({
        userId: kycSubmissions.userId,
        documentFrontUrl: kycSubmissions.documentFrontUrl,
        documentBackUrl: kycSubmissions.documentBackUrl,
        selfieUrl: kycSubmissions.selfieUrl,
      })
      .from(kycSubmissions)
      .where(eq(kycSubmissions.id, id));

    if (!submission) return badRequest("Không tìm thấy hồ sơ KYC");

    await db.update(kycSubmissions).set({
      status: newStatus,
      adminNote: adminNote || null,
      reviewedBy: parseInt(sessionUser.id),
      reviewedAt: now,
      updatedAt: now,
    }).where(eq(kycSubmissions.id, id));

    if (action === "approve") {
      await db.update(sellerProfiles).set({
        kycStatus: "approved",
        canSell: true,
        updatedAt: now,
      }).where(eq(sellerProfiles.userId, submission.userId));
    } else {
      await db.update(sellerProfiles).set({
        kycStatus: "rejected",
        canSell: false,
        updatedAt: now,
      }).where(eq(sellerProfiles.userId, submission.userId));
    }

    const objectKeys = [
      extractObjectKeyFromUrl(submission.documentFrontUrl),
      submission.documentBackUrl ? extractObjectKeyFromUrl(submission.documentBackUrl) : null,
      submission.selfieUrl ? extractObjectKeyFromUrl(submission.selfieUrl) : null,
    ].filter(Boolean) as string[];

    if (objectKeys.length > 0) {
      await deleteR2Objects(objectKeys).catch((err) => {
        console.error("[KYC] Không thể xóa ảnh KYC khỏi R2:", err);
      });
    }

    return ok({ success: true });
  } catch (error) {
    logApiError({ requestId: reqId, route: "PATCH /api/admin/kyc", message: "Thất bại", error });
    return serverError();
  }
}
