import Database from "better-sqlite3";
const db = new Database("sqlite.db");
const stmt = db.prepare("SELECT base_price, variants_json FROM seller_products LIMIT 5");
const rows = stmt.all();
console.log(JSON.stringify(rows, null, 2));
