/**
 * Free product columns bootstrap - works in both dev and production.
 * Adds is_free and free_download_url columns to seller_products table.
 */
import { client } from "@/lib/db";

let freeProductsReady = false;

export async function ensureFreeProductColumns(): Promise<void> {
  if (freeProductsReady) return;
  try {
    try { await client.execute("ALTER TABLE seller_products ADD COLUMN is_free INTEGER NOT NULL DEFAULT 0"); } catch (_) {}
    try { await client.execute("ALTER TABLE seller_products ADD COLUMN free_download_url TEXT NOT NULL DEFAULT ''"); } catch (_) {}
    freeProductsReady = true;
  } catch (_) {
    console.error("[free-products-bootstrap] Failed:", _);
  }
}
