import { and, desc, eq, sql } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { affiliateCommissions, affiliateReferrals, systemConfigs, users, wallets } from "@/lib/schema";
import { getRequestId, logApiError } from "@/lib/observability";

async function requireAdmin() {
  const session = await requireSessionUser();
  if (!session?.id) return null;
  const userRows = await db.select({ role: users.role }).from(users).where(eq(users.id, Number(session.id)));
  if (userRows[0]?.role !== "admin") return null;
  return session;
}

/** GET: Admin overview of affiliate system */
export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    await ensureDatabaseReady();
    const admin = await requireAdmin();
    if (!admin) return unauthorized("Chỉ admin mới có quyền truy cập", { requestId });

    // Config
    const configRows = await db.select().from(systemConfigs).where(
      sql`key IN ('affiliate_commission_rate', 'affiliate_duration_days', 'affiliate_enabled')`
    );
    const configMap: Record<string, string> = {};
    for (const c of configRows) configMap[c.key] = c.value;

    // Stats
    const totalReferrals = await db.select({ count: sql<number>`COUNT(*)` }).from(affiliateReferrals);
    const pendingCommissions = await db
      .select({ count: sql<number>`COUNT(*)`, total: sql<number>`SUM(commission_amount)` })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.status, "pending"));
    const paidCommissions = await db
      .select({ count: sql<number>`COUNT(*)`, total: sql<number>`SUM(commission_amount)` })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.status, "paid"));

    // Recent commissions with user info
    const recentCommissions = await db
      .select()
      .from(affiliateCommissions)
      .orderBy(desc(affiliateCommissions.createdAt))
      .limit(100);

    // Enrich with user names
    const userIds = [...new Set([
      ...recentCommissions.map(c => c.referrerId),
      ...recentCommissions.map(c => c.refereeId),
    ])];
    const userMap: Record<number, { name: string; email: string }> = {};
    for (const uid of userIds) {
      const rows = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, uid));
      if (rows[0]) userMap[uid] = rows[0];
    }

    // Top referrers
    const topReferrers = await db
      .select({
        referrerId: affiliateCommissions.referrerId,
        totalCommission: sql<number>`SUM(commission_amount)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.status, "paid"))
      .groupBy(affiliateCommissions.referrerId)
      .orderBy(sql`SUM(commission_amount) DESC`)
      .limit(10);

    return ok({
      data: {
        config: {
          commissionRate: parseFloat(configMap["affiliate_commission_rate"] || "1"),
          durationDays: parseInt(configMap["affiliate_duration_days"] || "365"),
          enabled: configMap["affiliate_enabled"] !== "0",
        },
        stats: {
          totalReferrals: Number(totalReferrals[0]?.count || 0),
          pendingCount: Number(pendingCommissions[0]?.count || 0),
          pendingAmount: Number(pendingCommissions[0]?.total || 0),
          paidCount: Number(paidCommissions[0]?.count || 0),
          paidAmount: Number(paidCommissions[0]?.total || 0),
        },
        topReferrers: topReferrers.map(r => ({
          ...r,
          name: userMap[r.referrerId]?.name || `User #${r.referrerId}`,
          email: userMap[r.referrerId]?.email || "",
        })),
        recentCommissions: recentCommissions.map(c => ({
          ...c,
          referrerName: userMap[c.referrerId]?.name || `#${c.referrerId}`,
          refereeName: userMap[c.refereeId]?.name || `#${c.refereeId}`,
          referrerEmail: userMap[c.referrerId]?.email || "",
        })),
      },
      requestId,
    });
  } catch (error) {
    logApiError({ requestId, route: "GET /api/admin/affiliate", message: "Lỗi admin affiliate", error });
    return serverError("Không thể tải dữ liệu", { requestId });
  }
}

/** PUT: Update affiliate config or pay out commissions */
export async function PUT(request: Request) {
  const requestId = getRequestId(request);
  try {
    await ensureDatabaseReady();
    const admin = await requireAdmin();
    if (!admin) return unauthorized("Chỉ admin", { requestId });

    const body = await request.json() as {
      action?: string;
      commissionRate?: number;
      durationDays?: number;
      enabled?: boolean;
      commissionIds?: number[];
    };

    const nowIso = new Date().toISOString();

    // Update config
    if (body.action === "update_config") {
      if (body.commissionRate !== undefined) {
        const rate = Number(body.commissionRate);
        if (isNaN(rate) || rate < 0 || rate > 100) return badRequest("Tỷ lệ hoa hồng không hợp lệ (0-100%)", { requestId });
        await db.update(systemConfigs).set({ value: String(rate), updatedAt: nowIso }).where(eq(systemConfigs.key, "affiliate_commission_rate"));
      }
      if (body.durationDays !== undefined) {
        const days = Number(body.durationDays);
        if (isNaN(days) || days < 1) return badRequest("Số ngày không hợp lệ", { requestId });
        await db.update(systemConfigs).set({ value: String(days), updatedAt: nowIso }).where(eq(systemConfigs.key, "affiliate_duration_days"));
      }
      if (body.enabled !== undefined) {
        await db.update(systemConfigs).set({ value: body.enabled ? "1" : "0", updatedAt: nowIso }).where(eq(systemConfigs.key, "affiliate_enabled"));
      }
      return ok({ message: "Đã cập nhật cấu hình affiliate", requestId });
    }

    // Pay out pending commissions
    if (body.action === "pay_commissions") {
      const ids = Array.isArray(body.commissionIds) ? body.commissionIds : [];
      if (ids.length === 0) return badRequest("Không có commission nào được chọn", { requestId });

      await db.transaction(async (tx) => {
        for (const cId of ids) {
          const rows = await tx.select().from(affiliateCommissions).where(
            and(eq(affiliateCommissions.id, cId), eq(affiliateCommissions.status, "pending"))
          );
          const comm = rows[0];
          if (!comm) continue;

          // Credit referrer wallet
          const walletRows = await tx.select().from(wallets).where(eq(wallets.userId, comm.referrerId));
          if (walletRows.length === 0) {
            await tx.insert(wallets).values({ userId: comm.referrerId, balance: comm.commissionAmount, updatedAt: nowIso });
          } else {
            await tx.update(wallets).set({
              balance: parseFloat((Number(walletRows[0].balance) + Number(comm.commissionAmount)).toFixed(2)),
              updatedAt: nowIso,
            }).where(eq(wallets.userId, comm.referrerId));
          }

          // Mark as paid
          await tx.update(affiliateCommissions).set({ status: "paid", paidAt: nowIso }).where(eq(affiliateCommissions.id, cId));
        }
      });

      return ok({ message: `Đã thanh toán ${ids.length} hoa hồng affiliate`, requestId });
    }

    return badRequest("Action không hợp lệ", { requestId });
  } catch (error) {
    logApiError({ requestId, route: "PUT /api/admin/affiliate", message: "Lỗi cập nhật affiliate", error });
    return serverError("Không thể cập nhật", { requestId });
  }
}
