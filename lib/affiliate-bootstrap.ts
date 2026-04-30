/**
 * Affiliate table bootstrap - works in both dev and production.
 * Call this at the start of any affiliate API route.
 */
import { client } from "@/lib/db";

let affiliateTablesReady = false;

export async function ensureAffiliateTables(): Promise<void> {
  if (affiliateTablesReady) return;
  try {
    // Add referral_code column to users (idempotent ALTER)
    try { await client.execute("ALTER TABLE users ADD COLUMN referral_code TEXT NOT NULL DEFAULT ''"); } catch (_) {}

    // affiliate_referrals table
    await client.execute(`CREATE TABLE IF NOT EXISTS affiliate_referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER NOT NULL,
      referee_id INTEGER NOT NULL UNIQUE,
      referral_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`);
    try { await client.execute("CREATE INDEX IF NOT EXISTS aff_ref_referrer_idx ON affiliate_referrals(referrer_id)"); } catch (_) {}
    try { await client.execute("CREATE INDEX IF NOT EXISTS aff_ref_code_idx ON affiliate_referrals(referral_code)"); } catch (_) {}

    // affiliate_commissions table
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
    try { await client.execute("CREATE INDEX IF NOT EXISTS aff_comm_referrer_idx ON affiliate_commissions(referrer_id, status)"); } catch (_) {}
    try { await client.execute("CREATE INDEX IF NOT EXISTS aff_comm_tx_idx ON affiliate_commissions(deposit_tx_id)"); } catch (_) {}

    // Seed default system configs (INSERT OR IGNORE = idempotent)
    try { await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('affiliate_commission_rate', '1', 'Tỷ lệ hoa hồng affiliate (%)', datetime('now'))"); } catch (_) {}
    try { await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('affiliate_duration_days', '365', 'Thời hạn hoa hồng affiliate (ngày)', datetime('now'))"); } catch (_) {}
    try { await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('affiliate_enabled', '1', 'Bật/tắt affiliate (1=bật)', datetime('now'))"); } catch (_) {}

    affiliateTablesReady = true;
  } catch (_) {
    // Non-blocking - log but don't crash the API
    console.error("[affiliate-bootstrap] Failed to ensure affiliate tables:", _);
  }
}
