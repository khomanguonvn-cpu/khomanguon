import { client } from "@/lib/db";

let ensurePromise: Promise<void> | null = null;

export async function ensurePartnerBrandLogosTable() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await client.execute(
        "CREATE TABLE IF NOT EXISTS partner_brand_logos (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, logo_url TEXT NOT NULL, link TEXT NOT NULL DEFAULT '', is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"
      );
      await client.execute(
        "CREATE INDEX IF NOT EXISTS partner_brand_logos_active_sort_idx ON partner_brand_logos(is_active, sort_order, id)"
      );
    })();
  }

  await ensurePromise;
}

export function normalizePartnerLogoText(input: unknown) {
  return String(input ?? "").trim();
}

export function normalizePartnerLogoSortOrder(input: unknown) {
  const value = Number(input);
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}
