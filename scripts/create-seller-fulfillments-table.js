// Script to create seller_fulfillments table
// Run: node scripts/create-seller-fulfillments-table.js
const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

// Load .env manually
const envPath = path.resolve(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf8");
for (const rawLine of envContent.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const equalIndex = line.indexOf("=");
  if (equalIndex === -1) continue;
  const key = line.slice(0, equalIndex).trim();
  let value = line.slice(equalIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("Connecting to Turso database...");

  try {
    // Create the table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS seller_fulfillments (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        order_item_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        qty INTEGER NOT NULL DEFAULT 1,
        amount REAL NOT NULL,
        fulfilled_data_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      )
    `);
    console.log("Table 'seller_fulfillments' created successfully!");

    // Create indexes
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_seller_fulfillments_order_item_id
      ON seller_fulfillments (order_item_id)
    `);
    console.log("Index 'idx_seller_fulfillments_order_item_id' created!");

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_seller_fulfillments_seller_id
      ON seller_fulfillments (seller_id)
    `);
    console.log("Index 'idx_seller_fulfillments_seller_id' created!");

    console.log("\nMigration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
