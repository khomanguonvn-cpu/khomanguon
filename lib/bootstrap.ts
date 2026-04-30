import { client } from "@/lib/db";

let initPromise: Promise<void> | null = null;
let initialized = false;

export async function ensureDatabaseReady() {
  if (process.env.NODE_ENV === 'production') return;
  if (initialized) return;
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      await client.execute("SELECT 1");
    } catch (e) {
      initialized = true;
      return;
    }

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', email_verified INTEGER NOT NULL DEFAULT 0, is_banned INTEGER NOT NULL DEFAULT 0, bank_name TEXT NOT NULL DEFAULT '', bank_account TEXT NOT NULL DEFAULT '', bank_account_holder TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE users ADD COLUMN bank_name TEXT NOT NULL DEFAULT ''");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE users ADD COLUMN bank_account TEXT NOT NULL DEFAULT ''");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE users ADD COLUMN bank_account_holder TEXT NOT NULL DEFAULT ''");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS user_bank_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, bank_name TEXT NOT NULL, bank_account TEXT NOT NULL, bank_account_holder TEXT NOT NULL, is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS user_bank_accounts_user_account_idx ON user_bank_accounts(user_id, bank_account)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS user_bank_accounts_default_idx ON user_bank_accounts(user_id, is_default, created_at)");
    } catch (e) {}
    try {
      await client.execute("INSERT INTO user_bank_accounts(user_id, bank_name, bank_account, bank_account_holder, is_default, created_at, updated_at) SELECT u.id, u.bank_name, u.bank_account, u.bank_account_holder, 1, COALESCE(u.updated_at, datetime('now')), COALESCE(u.updated_at, datetime('now')) FROM users u WHERE TRIM(COALESCE(u.bank_name, '')) <> '' AND TRIM(COALESCE(u.bank_account, '')) <> '' AND TRIM(COALESCE(u.bank_account_holder, '')) <> '' AND NOT EXISTS (SELECT 1 FROM user_bank_accounts uba WHERE uba.user_id = u.id AND uba.bank_account = u.bank_account)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS system_integrations (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT NOT NULL, is_encrypted INTEGER NOT NULL DEFAULT 0, updated_by INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS telegram_alerts (id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL, event TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', sent_at TEXT, created_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS ai_blog_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, prompt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', generated_content TEXT, scheduled_at TEXT, executed_at TEXT, created_by INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS saas_rentals (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, module TEXT NOT NULL, plan_name TEXT NOT NULL, amount REAL NOT NULL, billing_cycle_days INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'active', next_billing_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS seller_profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, rating_average REAL NOT NULL DEFAULT 5, rating_count INTEGER NOT NULL DEFAULT 0, dispute_count INTEGER NOT NULL DEFAULT 0, kyc_status TEXT NOT NULL DEFAULT 'not_submitted', can_sell INTEGER NOT NULL DEFAULT 0, telegram_bot_token TEXT NOT NULL DEFAULT '', telegram_chat_id TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE seller_profiles ADD COLUMN telegram_bot_token TEXT NOT NULL DEFAULT ''");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE seller_profiles ADD COLUMN telegram_chat_id TEXT NOT NULL DEFAULT ''");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS kyc_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, full_name TEXT NOT NULL, document_type TEXT NOT NULL, document_number TEXT NOT NULL, document_front_url TEXT NOT NULL, document_back_url TEXT, selfie_url TEXT, status TEXT NOT NULL DEFAULT 'pending', admin_note TEXT, reviewed_by INTEGER, reviewed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS vip_tiers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, price REAL NOT NULL, discount_percent INTEGER NOT NULL, duration_days INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS user_vip_subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, vip_tier_id INTEGER NOT NULL, discount_percent INTEGER NOT NULL, starts_at TEXT NOT NULL, expires_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS product_bumps (id INTEGER PRIMARY KEY AUTOINCREMENT, seller_id INTEGER NOT NULL, product_id TEXT NOT NULL, fee REAL NOT NULL, bumped_at TEXT NOT NULL, created_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS otp_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, purpose TEXT NOT NULL DEFAULT 'email_verify', code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, send_count INTEGER NOT NULL DEFAULT 1, window_started_at TEXT NOT NULL, resend_available_at TEXT NOT NULL, verified_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE otp_codes ADD COLUMN purpose TEXT NOT NULL DEFAULT 'email_verify'");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS addresses (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, phone_number TEXT NOT NULL, state TEXT NOT NULL, city TEXT NOT NULL, zip_code TEXT NOT NULL, address TEXT NOT NULL, country TEXT NOT NULL, created_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS carts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, cart_total REAL NOT NULL DEFAULT 0, products_json TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS coupons (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, discount_percent INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS wallets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, balance REAL NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS wallet_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, amount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending', payos_order_code TEXT, payos_payment_link_id TEXT, payos_checkout_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS wallet_withdraw_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, transaction_id INTEGER NOT NULL, amount_requested REAL NOT NULL, fee_amount REAL NOT NULL, amount_net REAL NOT NULL, bank_name TEXT NOT NULL, bank_account TEXT NOT NULL, account_holder TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', reject_reason TEXT, reviewed_by INTEGER, reviewed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS wallet_withdraw_requests_status_idx ON wallet_withdraw_requests(status, created_at)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS wallet_withdraw_requests_user_idx ON wallet_withdraw_requests(user_id, created_at)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS escrow_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, buyer_id INTEGER NOT NULL, seller_id INTEGER, order_id INTEGER NOT NULL, amount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'held', dispute_reason TEXT, dispute_opened_by INTEGER, dispute_opened_at TEXT, settled_by INTEGER, settled_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE escrow_transactions ADD COLUMN seller_id INTEGER");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE escrow_transactions ADD COLUMN dispute_reason TEXT");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE escrow_transactions ADD COLUMN dispute_opened_by INTEGER");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE escrow_transactions ADD COLUMN dispute_opened_at TEXT");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE escrow_transactions ADD COLUMN settled_by INTEGER");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE escrow_transactions ADD COLUMN settled_at TEXT");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, idempotency_key TEXT UNIQUE, products_json TEXT NOT NULL, shipping_address_json TEXT NOT NULL, payment_method TEXT NOT NULL, total REAL NOT NULL, total_before_discount REAL NOT NULL, coupon_applied TEXT, vip_discount_applied INTEGER NOT NULL DEFAULT 0, shipping_status TEXT NOT NULL, shipping_times TEXT NOT NULL, shipping_price REAL NOT NULL DEFAULT 0, payment_status TEXT NOT NULL DEFAULT 'pending', payos_order_code TEXT, payos_payment_link_id TEXT, payos_checkout_url TEXT, created_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE orders ADD COLUMN idempotency_key TEXT");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE orders ADD COLUMN payos_checkout_url TEXT");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE orders ADD COLUMN vip_discount_applied INTEGER NOT NULL DEFAULT 0");
    } catch (e) {}

    try {
      await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_idx ON orders(idempotency_key)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS product_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS product_subcategories (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER NOT NULL, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', listing_mode TEXT NOT NULL DEFAULT 'digital_account', variant_schema_json TEXT NOT NULL DEFAULT '[]', is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS seller_products (id INTEGER PRIMARY KEY AUTOINCREMENT, seller_id INTEGER NOT NULL, category_id INTEGER NOT NULL, subcategory_id INTEGER NOT NULL, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', delivery_method TEXT NOT NULL DEFAULT 'manual', stock INTEGER NOT NULL DEFAULT 0, base_price REAL NOT NULL, variants_json TEXT NOT NULL DEFAULT '[]', assets_json TEXT NOT NULL DEFAULT '[]', reviews_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("ALTER TABLE seller_products ADD COLUMN reviews_json TEXT NOT NULL DEFAULT '[]'");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS partner_brand_logos (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, logo_url TEXT NOT NULL, link TEXT NOT NULL DEFAULT '', is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS partner_brand_logos_active_sort_idx ON partner_brand_logos(is_active, sort_order, id)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS contact_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, subject TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS news_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', cover_image TEXT NOT NULL DEFAULT '', source_url TEXT NOT NULL DEFAULT '', original_title TEXT NOT NULL DEFAULT '', keywords_json TEXT NOT NULL DEFAULT '[]', tags_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', created_by INTEGER, updated_by INTEGER, published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS news_posts_status_published_idx ON news_posts(status, published_at, created_at)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS news_posts_created_by_idx ON news_posts(created_by, created_at)");
    } catch (e) {}

    try {
      await client.execute("INSERT OR IGNORE INTO coupons(code, discount_percent, active, created_at) VALUES ('WELCOME10', 10, 1, datetime('now'))");
    } catch (e) {}

    try {
      await client.execute("INSERT OR IGNORE INTO product_categories(slug, name, description, is_active, sort_order, created_at, updated_at) VALUES ('ma-nguon', 'Mã nguồn', 'Sản phẩm source code và template lập trình', 1, 1, datetime('now'), datetime('now'))");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_categories(slug, name, description, is_active, sort_order, created_at, updated_at) VALUES ('tai-khoan', 'Tài khoản', 'Tài khoản số phổ thông', 1, 2, datetime('now'), datetime('now'))");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_categories(slug, name, description, is_active, sort_order, created_at, updated_at) VALUES ('tai-khoan-ai', 'Tài khoản AI', 'Tài khoản dịch vụ trí tuệ nhân tạo', 1, 3, datetime('now'), datetime('now'))");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_categories(slug, name, description, is_active, sort_order, created_at, updated_at) VALUES ('mmo', 'MMO', 'Sản phẩm phục vụ kiếm tiền online', 1, 4, datetime('now'), datetime('now'))");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_categories(slug, name, description, is_active, sort_order, created_at, updated_at) VALUES ('saas', 'SaaS', 'Phần mềm dạng dịch vụ và công cụ vận hành', 1, 5, datetime('now'), datetime('now'))");
    } catch (e) {}

    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'ma-nguon'), 'php-laravel', 'PHP Laravel', 'Mã nguồn Laravel và module mở rộng', 'digital_license', '[{...}]', 1, 1, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'ma-nguon'), 'nodejs-nextjs', 'Node.js / Next.js', 'Source code Node.js, Next.js, NestJS', 'digital_license', '[{...}]', 1, 2, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'ma-nguon'), 'wordpress', 'WordPress', 'Theme, plugin và bộ web WordPress', 'digital_license', '[{...}]', 1, 3, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan'), 'youtube', 'Tài khoản YouTube', 'Tài khoản YouTube đã setup theo nhu cầu', 'digital_account', '[{...}]', 1, 10, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan'), 'telegram', 'Tài khoản Telegram', 'Tài khoản Telegram theo quốc gia và độ trust', 'digital_account', '[{...}]', 1, 11, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan-ai'), 'chatgpt', 'ChatGPT', 'Tài khoản ChatGPT Plus/Team', 'digital_account', '[{...}]', 1, 20, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan-ai'), 'claude', 'Claude', 'Tài khoản Claude Pro/Max', 'digital_account', '[{...}]', 1, 21, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan-ai'), 'gemini', 'Gemini', 'Tài khoản Gemini Advanced', 'digital_account', '[{...}]', 1, 22, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan-ai'), 'midjourney', 'Midjourney', 'Gói Midjourney theo số giờ', 'digital_subscription', '[{...}]', 1, 23, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'mmo'), 'facebook-ads', 'Facebook Ads', 'Tài nguyên và tài khoản chạy quảng cáo', 'digital_account', '[{...}]', 1, 30, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'mmo'), 'tiktok-ads', 'TikTok Ads', 'Tài khoản và tài nguyên chạy TikTok Ads', 'digital_account', '[{...}]', 1, 31, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'mmo'), 'dropshipping-tools', 'Dropshipping Tools', 'Tool hỗ trợ dropshipping', 'digital_subscription', '[{...}]', 1, 32, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'saas'), 'sms-otp', 'SMS OTP', 'Dịch vụ SMS OTP theo gói', 'service_package', '[{...}]', 1, 40, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'saas'), 'telegram-bot-rental', 'Telegram Bot Rental', 'Thuê bot Telegram theo chu kỳ', 'service_package', '[{...}]', 1, 41, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'saas'), 'crm-tools', 'CRM Tools', 'Công cụ CRM theo seat', 'service_package', '[{...}]', 1, 42, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'ma-nguon'), 'python-django-fastapi', 'Python Django / FastAPI', 'Mã nguồn backend Python và API service', 'digital_license', '[{...}]', 1, 4, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'ma-nguon'), 'java-spring', 'Java Spring', 'Mã nguồn Java Spring Boot', 'digital_license', '[{...}]', 1, 5, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'ma-nguon'), 'dotnet-csharp', '.NET / C#', 'Mã nguồn .NET web app, API, desktop', 'digital_license', '[{...}]', 1, 6, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'ma-nguon'), 'go-golang', 'Go / Golang', 'Mã nguồn Golang backend', 'digital_license', '[{...}]', 1, 7, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'ma-nguon'), 'react-vue-angular', 'React / Vue / Angular', 'Frontend source code templates', 'digital_license', '[{...}]', 1, 8, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'ma-nguon'), 'shopify-magento-opencart', 'Shopify / Magento / OpenCart', 'Theme và module ecommerce', 'digital_license', '[{...}]', 1, 9, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan'), 'facebook', 'Tài khoản Facebook', 'Tài khoản Facebook theo độ trust', 'digital_account', '[{...}]', 1, 12, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan'), 'tiktok', 'Tài khoản TikTok', 'Tài khoản TikTok theo quốc gia', 'digital_account', '[{...}]', 1, 13, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan'), 'instagram', 'Tài khoản Instagram', 'Tài khoản IG theo độ trust', 'digital_account', '[{...}]', 1, 14, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan'), 'gmail-outlook', 'Gmail / Outlook', 'Tài khoản mail phục vụ dịch vụ số', 'digital_account', '[{...}]', 1, 15, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan'), 'discord', 'Tài khoản Discord', 'Tài khoản Discord setup theo nhu cầu', 'digital_account', '[{...}]', 1, 16, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan-ai'), 'copilot', 'GitHub Copilot', 'Tài khoản Copilot cá nhân/team', 'digital_subscription', '[{...}]', 1, 24, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan-ai'), 'perplexity', 'Perplexity Pro', 'Tài khoản Perplexity Pro', 'digital_subscription', '[{...}]', 1, 25, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan-ai'), 'canva-ai', 'Canva AI', 'Tài khoản Canva Pro + AI', 'digital_subscription', '[{...}]', 1, 26, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'tai-khoan-ai'), 'runway-pika', 'Runway / Pika', 'Tài khoản AI tạo video', 'digital_subscription', '[{...}]', 1, 27, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'mmo'), 'google-ads', 'Google Ads', 'Tài khoản chạy quảng cáo Google', 'digital_account', '[{...}]', 1, 33, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'mmo'), 'bm-via-clone', 'BM / VIA / Clone', 'Tài nguyên nền tảng Facebook MMO', 'digital_account', '[{...}]', 1, 34, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'mmo'), 'proxy-vps-antidetect', 'Proxy / VPS / Antidetect', 'Hạ tầng vận hành MMO', 'service_package', '[{...}]', 1, 35, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'mmo'), 'tool-automation', 'Tool Automation', 'Tool tự động hóa tác vụ MMO', 'digital_license', '[{...}]', 1, 36, datetime('now'), datetime('now')");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO product_subcategories(category_id, slug, name, description, listing_mode, variant_schema_json, is_active, sort_order, created_at, updated_at) SELECT (SELECT id FROM product_categories WHERE slug = 'mmo'), 'affiliate-tools', 'Affiliate Tools', 'Bộ công cụ hỗ trợ affiliate', 'digital_subscription', '[{...}]', 1, 37, datetime('now'), datetime('now')");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, seller_id INTEGER NOT NULL, buyer_id INTEGER NOT NULL, seller_product_id INTEGER NOT NULL, product_name TEXT NOT NULL, variant_label TEXT NOT NULL DEFAULT '', qty INTEGER NOT NULL DEFAULT 1, price REAL NOT NULL, product_type TEXT NOT NULL DEFAULT 'digital', fulfillment_status TEXT NOT NULL DEFAULT 'pending', fulfilled_data_json TEXT NOT NULL DEFAULT '{}', fulfilled_at TEXT, auto_refund_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}

    // Seed withdraw_fee_percent config only if row doesn't exist yet.
    // INSERT OR IGNORE preserves any value the admin already saved via the API.
    try {
      await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('withdraw_fee_percent', '1', 'Phí rút tiền cho seller (% trên số tiền rút)', datetime('now'))");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS system_configs (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', updated_by INTEGER, updated_at TEXT NOT NULL)");
    } catch (e) {}

    try {
      await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('withdraw_fee_percent', '1', 'Phí rút tiền cho seller (% trên số tiền rút)', datetime('now'))");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS order_items_seller_status_idx ON order_items(seller_id, fulfillment_status, created_at)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS order_items_auto_refund_idx ON order_items(fulfillment_status, auto_refund_at)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS chat_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, participant_id INTEGER NOT NULL, participant_name TEXT NOT NULL DEFAULT '', participant_email TEXT NOT NULL DEFAULT '', admin_id INTEGER, type TEXT NOT NULL DEFAULT 'user_admin', status TEXT NOT NULL DEFAULT 'open', last_message TEXT NOT NULL DEFAULT '', last_message_at TEXT, unread_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS chat_conv_participant_idx ON chat_conversations(participant_id, type)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS chat_conv_admin_idx ON chat_conversations(admin_id)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, sender_id INTEGER NOT NULL, sender_name TEXT NOT NULL DEFAULT '', sender_role TEXT NOT NULL DEFAULT 'user', content TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, read_at TEXT, created_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS chat_msg_conv_idx ON chat_messages(conversation_id, created_at)");
    } catch (e) {}


    try {
      await client.execute("CREATE TABLE IF NOT EXISTS site_visitors (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT NOT NULL UNIQUE, country_code TEXT NOT NULL DEFAULT 'XX', country_name TEXT NOT NULL DEFAULT 'Không xác định', last_visit_at TEXT NOT NULL, created_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS site_visitors_ip_idx ON site_visitors(ip)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS site_visitors_country_idx ON site_visitors(country_code)");
    } catch (e) {}

    // =============================================
    // AFFILIATE SYSTEM TABLES
    // =============================================
    try {
      await client.execute("CREATE TABLE IF NOT EXISTS affiliate_referrals (id INTEGER PRIMARY KEY AUTOINCREMENT, referrer_id INTEGER NOT NULL, referee_id INTEGER NOT NULL UNIQUE, referral_code TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS affiliate_referrals_referrer_idx ON affiliate_referrals(referrer_id)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS affiliate_referrals_code_idx ON affiliate_referrals(referral_code)");
    } catch (e) {}

    try {
      await client.execute("CREATE TABLE IF NOT EXISTS affiliate_commissions (id INTEGER PRIMARY KEY AUTOINCREMENT, referrer_id INTEGER NOT NULL, referee_id INTEGER NOT NULL, deposit_tx_id INTEGER NOT NULL, deposit_amount REAL NOT NULL, commission_rate REAL NOT NULL DEFAULT 0.01, commission_amount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending', paid_at TEXT, created_at TEXT NOT NULL)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS affiliate_commissions_referrer_idx ON affiliate_commissions(referrer_id, status)");
    } catch (e) {}
    try {
      await client.execute("CREATE INDEX IF NOT EXISTS affiliate_commissions_tx_idx ON affiliate_commissions(deposit_tx_id)");
    } catch (e) {}

    // Affiliate config
    try {
      await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('affiliate_commission_rate', '1', 'Tỷ lệ hoa hồng affiliate (% trên mỗi lần nạp của user được giới thiệu)', datetime('now'))");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('affiliate_duration_days', '365', 'Thời hạn hoa hồng affiliate (ngày kể từ khi user đăng ký qua ref link)', datetime('now'))");
    } catch (e) {}
    try {
      await client.execute("INSERT OR IGNORE INTO system_configs(key, value, description, updated_at) VALUES ('affiliate_enabled', '1', 'Bật/tắt hệ thống affiliate (1=bật, 0=tắt)', datetime('now'))");
    } catch (e) {}

    // Add referral_code column to users table (idempotent ALTER)
    try {
      await client.execute("ALTER TABLE users ADD COLUMN referral_code TEXT NOT NULL DEFAULT ''");
    } catch (e) {}

    initialized = true;

  })();

  await initPromise;
}
