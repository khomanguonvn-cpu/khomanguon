-- Migration: Add seller_fulfillments table for tracking multiple fulfillments
-- Run this command in Turso CLI or any SQLite viewer:

-- turso db shell <your-database-name>

CREATE TABLE IF NOT EXISTS seller_fulfillments (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  order_item_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  amount REAL NOT NULL,
  fulfilled_data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

-- Optional: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seller_fulfillments_order_item_id ON seller_fulfillments (order_item_id);
CREATE INDEX IF NOT EXISTS idx_seller_fulfillments_seller_id ON seller_fulfillments (seller_id);
