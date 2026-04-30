import { and, desc, eq, gte, sql } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { affiliateCommissions, affiliateReferrals, systemConfigs, users } from "@/lib/schema";
import { getRequestId, logApiError } from "@/lib/observability";
import { nanoid } from "nanoid";

/** Generate unique 8-char referral code */
function generateReferralCode(): string {
  return nanoid(8).toUpperCase();
}

/** GET: Return affiliate dashboard data for current user */
export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    await ensureDatabaseReady();
    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) return unauthorized("Không được phép", { requestId });

    const userId = Number(sessionUser.id);

    // Get or generate referral code for this user
    const userRows = await db
      .select({ id: users.id, referralCode: users.referralCode, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId));

    if (!userRows[0]) return badRequest("Không tìm thấy người dùng", { requestId });
    const userRow = userRows[0];

    // Auto-generate code if missing
    if (!userRow.referralCode) {
      let code = generateReferralCode();
      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 5) {
        const existing = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code));
        if (existing.length === 0) break;
        code = generateReferralCode();
        attempts++;
      }
      await db.update(users).set({ referralCode: code, updatedAt: new Date().toISOString() } as any).where(eq(users.id, userId));
      userRow.referralCode = code;
    }

    // Get affiliate config
    const configRows = await db.select().from(systemConfigs).where(
      sql`key IN ('affiliate_commission_rate', 'affiliate_duration_days', 'affiliate_enabled')`
    );
    const configMap: Record<string, string> = {};
    for (const c of configRows) configMap[c.key] = c.value;

    const commissionRate = parseFloat(configMap["affiliate_commission_rate"] || "1") / 100;
    const durationDays = parseInt(configMap["affiliate_duration_days"] || "365");
    const enabled = configMap["affiliate_enabled"] !== "0";

    // Count referrals
    const referralRows = await db
      .select()
      .from(affiliateReferrals)
      .where(eq(affiliateReferrals.referrerId, userId));

    // Get commissions
    const commissionRows = await db
      .select({
        id: affiliateCommissions.id,
        refereeId: affiliateCommissions.refereeId,
        depositAmount: affiliateCommissions.depositAmount,
        commissionAmount: affiliateCommissions.commissionAmount,
        status: affiliateCommissions.status,
        paidAt: affiliateCommissions.paidAt,
        createdAt: affiliateCommissions.createdAt,
      })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.referrerId, userId))
      .orderBy(desc(affiliateCommissions.createdAt))
      .limit(50);

    // Totals
    const totalEarned = commissionRows
      .filter(c => c.status === "paid")
      .reduce((s, c) => s + Number(c.commissionAmount || 0), 0);
    const totalPending = commissionRows
      .filter(c => c.status === "pending")
      .reduce((s, c) => s + Number(c.commissionAmount || 0), 0);

    // Enrich with referee names (mask email)
    const refereeIds = [...new Set(commissionRows.map(c => c.refereeId))];
    const refereeMap: Record<number, string> = {};
    if (refereeIds.length > 0) {
      for (const rid of refereeIds) {
        const rRows = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, rid));
        if (rRows[0]) {
          const e = rRows[0].email || "";
          const masked = e.length > 4 ? e.slice(0, 2) + "***" + e.slice(e.indexOf("@")) : "***";
          refereeMap[rid] = rRows[0].name || masked;
        }
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://khomanguon.io.vn";
    const referralLink = `${baseUrl}/register?ref=${userRow.referralCode}`;

    return ok({
      data: {
        enabled,
        referralCode: userRow.referralCode,
        referralLink,
        commissionRate: commissionRate * 100, // return as percentage e.g. 1
        durationDays,
        totalReferrals: referralRows.length,
        activeReferrals: referralRows.filter(r => r.expiresAt > new Date().toISOString()).length,
        totalEarned: parseFloat(totalEarned.toFixed(0)),
        totalPending: parseFloat(totalPending.toFixed(0)),
        commissions: commissionRows.map(c => ({
          ...c,
          refereeName: refereeMap[c.refereeId] || `User #${c.refereeId}`,
        })),
      },
      requestId,
    });
  } catch (error) {
    logApiError({ requestId, route: "GET /api/affiliate", message: "Lỗi affiliate", error });
    return serverError("Không thể tải dữ liệu affiliate", { requestId });
  }
}
