CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone_number` text NOT NULL,
	`state` text NOT NULL,
	`city` text NOT NULL,
	`zip_code` text NOT NULL,
	`address` text NOT NULL,
	`country` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_blog_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`prompt` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`generated_content` text,
	`scheduled_at` text,
	`executed_at` text,
	`created_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`cart_total` real DEFAULT 0 NOT NULL,
	`products_json` text DEFAULT '[]' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `carts_user_id_unique` ON `carts` (`user_id`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`discount_percent` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `escrow_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`buyer_id` integer NOT NULL,
	`seller_id` integer,
	`order_id` integer NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'held' NOT NULL,
	`dispute_reason` text,
	`dispute_opened_by` integer,
	`dispute_opened_at` text,
	`settled_by` integer,
	`settled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kyc_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`full_name` text NOT NULL,
	`document_type` text NOT NULL,
	`document_number` text NOT NULL,
	`document_front_url` text NOT NULL,
	`document_back_url` text,
	`selfie_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_note` text,
	`reviewed_by` integer,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `news_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`cover_image` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`original_title` text DEFAULT '' NOT NULL,
	`keywords_json` text DEFAULT '[]' NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` integer,
	`updated_by` integer,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_posts_slug_unique` ON `news_posts` (`slug`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`seller_id` integer NOT NULL,
	`buyer_id` integer NOT NULL,
	`seller_product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`variant_label` text DEFAULT '' NOT NULL,
	`qty` integer DEFAULT 1 NOT NULL,
	`price` real NOT NULL,
	`product_type` text DEFAULT 'digital' NOT NULL,
	`fulfillment_status` text DEFAULT 'pending' NOT NULL,
	`fulfilled_data_json` text DEFAULT '{}' NOT NULL,
	`fulfilled_at` text,
	`auto_refund_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`idempotency_key` text,
	`products_json` text NOT NULL,
	`shipping_address_json` text NOT NULL,
	`payment_method` text NOT NULL,
	`total` real NOT NULL,
	`total_before_discount` real NOT NULL,
	`coupon_applied` text,
	`vip_discount_applied` integer DEFAULT 0 NOT NULL,
	`shipping_status` text NOT NULL,
	`shipping_times` text NOT NULL,
	`shipping_price` real DEFAULT 0 NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`payos_order_code` text,
	`payos_payment_link_id` text,
	`payos_checkout_url` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_key_unique` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`purpose` text DEFAULT 'email_verify' NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`send_count` integer DEFAULT 1 NOT NULL,
	`window_started_at` text NOT NULL,
	`resend_available_at` text NOT NULL,
	`verified_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_bumps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seller_id` integer NOT NULL,
	`product_id` text NOT NULL,
	`fee` real NOT NULL,
	`bumped_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_categories_slug_unique` ON `product_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `product_subcategories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`listing_mode` text DEFAULT 'digital_account' NOT NULL,
	`variant_schema_json` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_subcategories_slug_unique` ON `product_subcategories` (`slug`);--> statement-breakpoint
CREATE TABLE `saas_rentals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`module` text NOT NULL,
	`plan_name` text NOT NULL,
	`amount` real NOT NULL,
	`billing_cycle_days` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`next_billing_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seller_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seller_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`subcategory_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`delivery_method` text DEFAULT 'manual' NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`base_price` real NOT NULL,
	`variants_json` text DEFAULT '[]' NOT NULL,
	`assets_json` text DEFAULT '[]' NOT NULL,
	`reviews_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seller_products_slug_unique` ON `seller_products` (`slug`);--> statement-breakpoint
CREATE TABLE `seller_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`rating_average` real DEFAULT 5 NOT NULL,
	`rating_count` integer DEFAULT 0 NOT NULL,
	`dispute_count` integer DEFAULT 0 NOT NULL,
	`kyc_status` text DEFAULT 'not_submitted' NOT NULL,
	`can_sell` integer DEFAULT false NOT NULL,
	`telegram_bot_token` text DEFAULT '' NOT NULL,
	`telegram_chat_id` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seller_profiles_user_id_unique` ON `seller_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `slides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text DEFAULT 'banner-home' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`btn` text DEFAULT '' NOT NULL,
	`link` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`text_color` text DEFAULT '#ffffff' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`updated_by` integer,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `system_configs_key_unique` ON `system_configs` (`key`);--> statement-breakpoint
CREATE TABLE `system_integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`is_encrypted` integer DEFAULT false NOT NULL,
	`updated_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `system_integrations_key_unique` ON `system_integrations` (`key`);--> statement-breakpoint
CREATE TABLE `telegram_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`level` text NOT NULL,
	`event` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`sent_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_bank_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`bank_name` text NOT NULL,
	`bank_account` text NOT NULL,
	`bank_account_holder` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_vip_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`vip_tier_id` integer NOT NULL,
	`discount_percent` integer NOT NULL,
	`starts_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`is_banned` integer DEFAULT false NOT NULL,
	`bank_name` text DEFAULT '' NOT NULL,
	`bank_account` text DEFAULT '' NOT NULL,
	`bank_account_holder` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vip_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` real NOT NULL,
	`discount_percent` integer NOT NULL,
	`duration_days` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vip_tiers_name_unique` ON `vip_tiers` (`name`);--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payos_order_code` text,
	`payos_payment_link_id` text,
	`payos_checkout_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wallet_withdraw_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`transaction_id` integer NOT NULL,
	`amount_requested` real NOT NULL,
	`fee_amount` real NOT NULL,
	`amount_net` real NOT NULL,
	`bank_name` text NOT NULL,
	`bank_account` text NOT NULL,
	`account_holder` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reject_reason` text,
	`reviewed_by` integer,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallets_user_id_unique` ON `wallets` (`user_id`);