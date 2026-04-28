
import { and, desc, eq, gte } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { userVipSubscriptions, vipTiers, wallets, walletTransactions } from "@/lib/schema";
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
    const nowIso = new Date().toISOString();

    const activeRows = await db
      .select()
      .from(userVipSubscriptions)
      .where(
        and(
          eq(userVipSubscriptions.userId, userId),
          eq(userVipSubscriptions.status, "active"),
          gte(userVipSubscriptions.expiresAt, nowIso)
        )
      )
      .orderBy(desc(userVipSubscriptions.expiresAt));

    return ok({ data: activeRows[0] || null, requestId });
  } catch (error) {
    logApiError({ requestId, route: "GET /api/vip/subscribe", message: "Không thể lấy VIP subscription", error });
    return serverError("Không thể lấy VIP subscription", { requestId });
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
    const vipTierId = Number(body?.vipTierId);

    if (!Number.isFinite(vipTierId)) {
      return badRequest("vipTierId không hợp lệ", { requestId });
    }

    const tierRows = await db.select().from(vipTiers).where(eq(vipTiers.id, vipTierId));
    const tier = tierRows[0];

    if (!tier || !tier.active) {
      return badRequest("VIP tier không hợp lệ hoặc đã tắt", { requestId });
    }

    const nowIso = new Date().toISOString();

    await db.transaction(async (tx) => {
      const walletRows = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      const wallet = walletRows[0];

      if (!wallet || wallet.balance < tier.price) {
        throw new Error("INSUFFICIENT_WALLET_BALANCE");
      }

      const nextBalance = Number((wallet.balance - tier.price).toFixed(2));
      await tx
        .update(wallets)
        .set({ balance: nextBalance, updatedAt: nowIso })
        .where(eq(wallets.id, wallet.id));

      const expiresAt = new Date(
        Date.now() + tier.durationDays * 24 * 60 * 60 * 1000
      ).toISOString();

      await tx.insert(userVipSubscriptions).values({
        userId,
        vipTierId: tier.id,
        discountPercent: tier.discountPercent,
        startsAt: nowIso,
        expiresAt,
        status: "active",
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await tx.insert(walletTransactions).values({
        userId,
        type: "vip_subscription",
        amount: tier.price,
        status: "success",
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    });

    return ok({ message: "Đăng ký VIP thành công", requestId });
  } catch (error) {
    if (String(error).includes("INSUFFICIENT_WALLET_BALANCE")) {
      return badRequest("Số dư ví không đủ để đăng ký VIP", { requestId });
    }

    logApiError({ requestId, route: "POST /api/vip/subscribe", message: "Không thể đăng ký VIP", error });
    return serverError("Không thể đăng ký VIP", { requestId });
  }
}
