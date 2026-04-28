
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses, sellerProfiles, userBankAccounts, users } from "@/lib/schema";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError, logApiWarn } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      logApiWarn({ requestId, route: "GET /api/user", message: "Truy cập trái phép" });
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();
    const userId = searchParams.get("user_id")?.trim();

    if (!email && !userId) {
      return badRequest("Thiếu email hoặc user_id", { requestId });
    }

    const sessionUserId = Number(sessionUser.id);
    let found = null as (typeof users.$inferSelect) | null;

    if (email) {
      if (email !== String(sessionUser.email || "").toLowerCase()) {
        logApiWarn({ requestId, route: "GET /api/user", message: "Vi phạm quyền sở hữu Email" });
        return unauthorized("Bạn không có quyền xem thông tin email này", { requestId });
      }

      const byEmail = await db.select().from(users).where(eq(users.email, email));
      found = byEmail[0] ?? null;
    }

    if (!found && userId) {
      const userIdNumber = Number(userId);
      if (!Number.isFinite(userIdNumber)) {
        return badRequest("user_id không hợp lệ", { requestId });
      }

      if (userIdNumber !== sessionUserId) {
        logApiWarn({ requestId, route: "GET /api/user", message: "Vi phạm quyền sở hữu ID người dùng" });
        return unauthorized("Bạn không có quyền xem thông tin người dùng này", { requestId });
      }

      const byId = await db.select().from(users).where(eq(users.id, userIdNumber));
      found = byId[0] ?? null;
    }

    if (!found) {
      return ok({ data: null, message: "Không tìm thấy người dùng", requestId });
    }

    const addressRows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, found.id));

    const sellerRows = await db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, found.id));

    const bankRows = await db
      .select({
        id: userBankAccounts.id,
        bankName: userBankAccounts.bankName,
        bankAccount: userBankAccounts.bankAccount,
        bankAccountHolder: userBankAccounts.bankAccountHolder,
        isDefault: userBankAccounts.isDefault,
      })
      .from(userBankAccounts)
      .where(eq(userBankAccounts.userId, found.id));

    const seller = sellerRows[0] || null;
    const hasSellerAccount = Boolean(seller);
    const sellerStatus = (seller?.kycStatus || "not_submitted") as
      | "not_submitted"
      | "pending"
      | "approved"
      | "rejected";

    return ok({
      data: {
        _id: String(found.id),
        name: found.name,
        email: found.email,
        role: String(found.role || "user").trim().toLowerCase(),
        emailVerified: found.emailVerified,
        bankInfo: {
          bankName: found.bankName || "",
          bankAccount: found.bankAccount || "",
          bankAccountHolder: found.bankAccountHolder || "",
          isConfigured: Boolean(found.bankName && found.bankAccount && found.bankAccountHolder),
        },
        bankAccounts: bankRows.map((item) => ({
          id: String(item.id),
          bankName: item.bankName,
          bankAccount: item.bankAccount,
          bankAccountHolder: item.bankAccountHolder,
          isDefault: Boolean(item.isDefault),
        })),
        sellerVerification: {
          hasSellerAccount,
          status: sellerStatus,
          isVerified: hasSellerAccount && sellerStatus === "approved",
          showWarning: hasSellerAccount && sellerStatus !== "approved",
        },
        address: addressRows.map((item) => ({
          _id: String(item.id),
          firstName: item.firstName,
          lastName: item.lastName,
          city: item.city,
          country: item.country,
          zipCode: item.zipCode,
          address: item.address,
          phoneNumber: item.phoneNumber,
          state: item.state,
        })),
      },
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/user",
      message: "Không thể lấy dữ liệu người dùng",
      error,
    });
    return serverError("Không thể lấy dữ liệu người dùng", { requestId });
  }
}
