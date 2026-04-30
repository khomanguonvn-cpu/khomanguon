import { desc, eq } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { db } from "@/lib/db";
import { client } from "@/lib/db";
import { affiliateCommissions, affiliateReferrals, systemConfigs, users } from "@/lib/schema";
import { getRequestId, logApiError } from "@/lib/observability";
import crypto from "crypto";

/** Generate unique 8-char referral code */
function generateReferralCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/** Ensure affiliate tables exist (runs in both dev & prod) */
async function ensureAffiliateTables() {
  try {
    // Add referral_code column to users (idempotent)
    try { await client.execute("ALTER TABLE users ADD COLUMN referral_code TEXT NOT NULL DEFAULT ''"); } catch (_) {}

    // affiliate_referrals
    await client.execute(`CREATE TABLE IF NOT EXISTS affiliate_referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER NOT NULL,
      referee_id INTEGER NOT NULL UNIQUE,
      referral_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`);
    try { await client.execute("CREATE INDEX IF NOT EXISTS affiliate_referrals_referrer_idx ON affiliate_referrals(referrer_id)"); } catch (_) {}
    try { await client.execute("CREATE INDEX IF NOT EXISTS affiliate_referrals_code_idx ON affiliate_referrals(referral_code)"); } catch (_) {}

    // affiliate_commissions
    await client.execute(`CREATE TABLE IF NOT EXISTS affiliate_commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER NOT NULL,
      referee_id INTEGER NOT NULL,
      deposit_tx_id INTEGER NOT NULL,
      deposit_amount REAL NOT NULL,
      commission_rate REAL NOT NULL DEFAULT 0.01,
      commission_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_at TEXT,
      created_at TEXT NOT NULL
    )`);
    try { await client.execute("CREATE INDEX IF NOT EXISTS affiliate_commissions_referrer_idx ON affiliate_commissions(referrer_id, status)"); } catch (_) {}
    try { await client.execute("CREATE INDEX IF NOT EXISTS affiliate_commissions_tx_idx ON affiliate_commissions(deposit_tx_id)"); } catch (_) {}

    // Seed default configs if missing
    try { await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('affiliate_commission_rate', '1', 'Tỷ lệ hoa hồng affiliate (%)', datetime('now'))"); } catch (_) {}
    try { await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('affiliate_duration_days', '365', 'Thời hạn hoa hồng affiliate (ngày)', datetime('now'))"); } catch (_) {}
    try { await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('affiliate_enabled', '1', 'Bật/tắt affiliate (1=bật)', datetime('now'))"); } catch (_) {}
  } catch (_) {
    // Non-blocking - if DB connection fails just continue
  }
}

/** GET: Return affiliate dashboard data for current user */
export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    // Always ensure tables exist (works in prod too)
    await ensureAffiliateTables();

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
      let attempts = 0;
      while (attempts < 5) {
        const existing = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code));
        if (existing.length === 0) break;
        code = generateReferralCode();
        attempts++;
      }
      await db.update(users)
        .set({ referralCode: code, updatedAt: new Date().toISOString() })
        .where(eq(users.id, userId));
      userRow.referralCode = code;
    }

    // Get affiliate config (read all, filter in JS to avoid dialect issues)
    const allConfigs = await db.select().from(systemConfigs);
    const configMap: Record<string, string> = {};
    for (const c of allConfigs) {
      if (["affiliate_commission_rate", "affiliate_duration_days", "affiliate_enabled"].includes(c.key)) {
        configMap[c.key] = c.value;
      }
    }

    const commissionRatePct = parseFloat(configMap["affiliate_commission_rate"] || "1");
    const commissionRate = commissionRatePct / 100;
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
    for (const rid of refereeIds) {
      const rRows = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, rid));
      if (rRows[0]) {
        const e = rRows[0].email || "";
        const masked = e.length > 4 ? e.slice(0, 2) + "***" + e.slice(e.indexOf("@")) : "***";
        refereeMap[rid] = rRows[0].name || masked;
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://khomanguon.io.vn";
    const referralLink = `${baseUrl}/register?ref=${userRow.referralCode}`;

    return ok({
      data: {
        enabled,
        referralCode: userRow.referralCode,
        referralLink,
        commissionRate: commissionRatePct,
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
