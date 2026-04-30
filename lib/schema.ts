import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  emailVerified: int("email_verified", { mode: "boolean" }).notNull().default(false),
  isBanned: int("is_banned", { mode: "boolean" }).notNull().default(false),
  bankName: text("bank_name").notNull().default(""),
  bankAccount: text("bank_account").notNull().default(""),
  bankAccountHolder: text("bank_account_holder").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userBankAccounts = sqliteTable("user_bank_accounts", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull(),
  bankName: text("bank_name").notNull(),
  bankAccount: text("bank_account").notNull(),
  bankAccountHolder: text("bank_account_holder").notNull(),
  isDefault: int("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const systemIntegrations = sqliteTable("system_integrations", {
  id: int("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  isEncrypted: int("is_encrypted", { mode: "boolean" }).notNull().default(false),
  updatedBy: int("updated_by"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const systemConfigs = sqliteTable("system_configs", {
  id: int("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description").notNull().default(""),
  updatedBy: int("updated_by"),
  updatedAt: text("updated_at").notNull(),
});

export const telegramAlerts = sqliteTable("telegram_alerts", {
  id: int("id").primaryKey({ autoIncrement: true }),
  level: text("level").notNull(),
  event: text("event").notNull(),
  payload: text("payload").notNull(),
  status: text("status").notNull().default("pending"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull(),
});

export const aiBlogJobs = sqliteTable("ai_blog_jobs", {
  id: int("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  status: text("status").notNull().default("pending"),
  generatedContent: text("generated_content"),
  scheduledAt: text("scheduled_at"),
  executedAt: text("executed_at"),
  createdBy: int("created_by"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const saasRentals = sqliteTable("saas_rentals", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull(),
  module: text("module").notNull(),
  planName: text("plan_name").notNull(),
  amount: real("amount").notNull(),
  billingCycleDays: int("billing_cycle_days").notNull(),
  status: text("status").notNull().default("active"),
  nextBillingAt: text("next_billing_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sellerProfiles = sqliteTable("seller_profiles", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull().unique(),
  ratingAverage: real("rating_average").notNull().default(5),
  ratingCount: int("rating_count").notNull().default(0),
  disputeCount: int("dispute_count").notNull().default(0),
  kycStatus: text("kyc_status").notNull().default("not_submitted"),
  canSell: int("can_sell", { mode: "boolean" }).notNull().default(false),
  telegramBotToken: text("telegram_bot_token").notNull().default(""),
  telegramChatId: text("telegram_chat_id").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

export const kycSubmissions = sqliteTable("kyc_submissions", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull(),
  fullName: text("full_name").notNull(),
  documentType: text("document_type").notNull(),
  documentNumber: text("document_number").notNull(),
  documentFrontUrl: text("document_front_url").notNull(),
  documentBackUrl: text("document_back_url"),
  selfieUrl: text("selfie_url"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedBy: int("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const otpCodes = sqliteTable("otp_codes", {
  id: int("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  purpose: text("purpose").notNull().default("email_verify"),
  codeHash: text("code_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  attempts: int("attempts").notNull().default(0),
  sendCount: int("send_count").notNull().default(1),
  windowStartedAt: text("window_started_at").notNull(),
  resendAvailableAt: text("resend_available_at").notNull(),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const addresses = sqliteTable("addresses", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  state: text("state").notNull(),
  city: text("city").notNull(),
  zipCode: text("zip_code").notNull(),
  address: text("address").notNull(),
  country: text("country").notNull(),
  createdAt: text("created_at").notNull(),
});

export const carts = sqliteTable("carts", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull().unique(),
  cartTotal: real("cart_total").notNull().default(0),
  productsJson: text("products_json").notNull().default("[]"),
  updatedAt: text("updated_at").notNull(),
});

export const coupons = sqliteTable("coupons", {
  id: int("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  discountPercent: int("discount_percent").notNull(),
  active: int("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const vipTiers = sqliteTable("vip_tiers", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  price: real("price").notNull(),
  discountPercent: int("discount_percent").notNull(),
  durationDays: int("duration_days").notNull(),
  active: int("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userVipSubscriptions = sqliteTable("user_vip_subscriptions", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull(),
  vipTierId: int("vip_tier_id").notNull(),
  discountPercent: int("discount_percent").notNull(),
  startsAt: text("starts_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const productBumps = sqliteTable("product_bumps", {
  id: int("id").primaryKey({ autoIncrement: true }),
  sellerId: int("seller_id").notNull(),
  productId: text("product_id").notNull(),
  fee: real("fee").notNull(),
  bumpedAt: text("bumped_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const wallets = sqliteTable("wallets", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull().unique(),
  balance: real("balance").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const walletTransactions = sqliteTable("wallet_transactions", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull(),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"),
  payosOrderCode: text("payos_order_code"),
  payosPaymentLinkId: text("payos_payment_link_id"),
  payosCheckoutUrl: text("payos_checkout_url"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const walletWithdrawRequests = sqliteTable("wallet_withdraw_requests", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull(),
  transactionId: int("transaction_id").notNull(),
  amountRequested: real("amount_requested").notNull(),
  feeAmount: real("fee_amount").notNull(),
  amountNet: real("amount_net").notNull(),
  bankName: text("bank_name").notNull(),
  bankAccount: text("bank_account").notNull(),
  accountHolder: text("account_holder").notNull(),
  status: text("status").notNull().default("pending"),
  rejectReason: text("reject_reason"),
  reviewedBy: int("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const escrowTransactions = sqliteTable("escrow_transactions", {
  id: int("id").primaryKey({ autoIncrement: true }),
  buyerId: int("buyer_id").notNull(),
  sellerId: int("seller_id"),
  orderId: int("order_id").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("held"),
  disputeReason: text("dispute_reason"),
  disputeOpenedBy: int("dispute_opened_by"),
  disputeOpenedAt: text("dispute_opened_at"),
  settledBy: int("settled_by"),
  settledAt: text("settled_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull(),
  idempotencyKey: text("idempotency_key").unique(),
  productsJson: text("products_json").notNull(),
  shippingAddressJson: text("shipping_address_json").notNull(),
  paymentMethod: text("payment_method").notNull(),
  total: real("total").notNull(),
  totalBeforeDiscount: real("total_before_discount").notNull(),
  couponApplied: text("coupon_applied"),
  vipDiscountApplied: int("vip_discount_applied").notNull().default(0),
  shippingStatus: text("shipping_status").notNull(),
  shippingTimes: text("shipping_times").notNull(),
  shippingPrice: real("shipping_price").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("pending"),
  payosOrderCode: text("payos_order_code"),
  payosPaymentLinkId: text("payos_payment_link_id"),
  payosCheckoutUrl: text("payos_checkout_url"),
  createdAt: text("created_at").notNull(),
});

export const productCategories = sqliteTable("product_categories", {
  id: int("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  isActive: int("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const productSubcategories = sqliteTable("product_subcategories", {
  id: int("id").primaryKey({ autoIncrement: true }),
  categoryId: int("category_id").notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  listingMode: text("listing_mode").notNull().default("digital_account"),
  variantSchemaJson: text("variant_schema_json").notNull().default("[]"),
  isActive: int("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sellerProducts = sqliteTable("seller_products", {
  id: int("id").primaryKey({ autoIncrement: true }),
  sellerId: int("seller_id").notNull(),
  categoryId: int("category_id").notNull(),
  subcategoryId: int("subcategory_id").notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  deliveryMethod: text("delivery_method").notNull().default("manual"),
  stock: int("stock").notNull().default(0),
  basePrice: real("base_price").notNull(),
  variantsJson: text("variants_json").notNull().default("[]"),
  assetsJson: text("assets_json").notNull().default("[]"),
  reviewsJson: text("reviews_json").notNull().default("[]"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const slides = sqliteTable("slides", {
  id: int("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().default("banner-home"),
  title: text("title").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  btn: text("btn").notNull().default(""),
  link: text("link").notNull().default(""),
  image: text("image").notNull().default(""),
  textColor: text("text_color").notNull().default("#ffffff"),
  isActive: int("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const partnerBrandLogos = sqliteTable("partner_brand_logos", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  logoUrl: text("logo_url").notNull(),
  link: text("link").notNull().default(""),
  isActive: int("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const contactMessages = sqliteTable("contact_messages", {
  id: int("id").primaryKey({ autoIncrement: true }),
  subject: text("subject").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
});

export const newsPosts = sqliteTable("news_posts", {
  id: int("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  coverImage: text("cover_image").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  originalTitle: text("original_title").notNull().default(""),
  keywordsJson: text("keywords_json").notNull().default("[]"),
  tagsJson: text("tags_json").notNull().default("[]"),
  status: text("status").notNull().default("draft"),
  createdBy: int("created_by"),
  updatedBy: int("updated_by"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: int("id").primaryKey({ autoIncrement: true }),
  orderId: int("order_id").notNull(),
  sellerId: int("seller_id").notNull(),
  buyerId: int("buyer_id").notNull(),
  sellerProductId: int("seller_product_id").notNull(),
  productName: text("product_name").notNull(),
  variantLabel: text("variant_label").notNull().default(""),
  qty: int("qty").notNull().default(1),
  price: real("price").notNull(),
  productType: text("product_type").notNull().default("digital"),
  fulfillmentStatus: text("fulfillment_status").notNull().default("pending"),
  fulfilledDataJson: text("fulfilled_data_json").notNull().default("{}"),
  fulfilledAt: text("fulfilled_at"),
  autoRefundAt: text("auto_refund_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const chatConversations = sqliteTable("chat_conversations", {
  id: int("id").primaryKey({ autoIncrement: true }),
  participantId: int("participant_id").notNull(),
  participantName: text("participant_name").notNull().default(""),
  participantEmail: text("participant_email").notNull().default(""),
  adminId: int("admin_id"),
  type: text("type").notNull().default("user_admin"),
  status: text("status").notNull().default("open"),
  lastMessage: text("last_message").notNull().default(""),
  lastMessageAt: text("last_message_at"),
  unreadCount: int("unread_count").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: int("id").primaryKey({ autoIncrement: true }),
  conversationId: int("conversation_id").notNull(),
  senderId: int("sender_id").notNull(),
  senderName: text("sender_name").notNull().default(""),
  senderRole: text("sender_role").notNull().default("user"),
  content: text("content").notNull(),
  isRead: int("is_read", { mode: "boolean" }).notNull().default(false),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull(),
});

export const sellerFulfillments = sqliteTable("seller_fulfillments", {
  id: int("id").primaryKey({ autoIncrement: true }),
  orderItemId: int("order_item_id").notNull(),
  sellerId: int("seller_id").notNull(),
  qty: int("qty").notNull().default(1),
  amount: real("amount").notNull(),
  fulfilledDataJson: text("fulfilled_data_json").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
});

export const siteVisitors = sqliteTable("site_visitors", {
  id: int("id").primaryKey({ autoIncrement: true }),
  ip: text("ip").notNull().unique(),
  countryCode: text("country_code").notNull().default("XX"),
  countryName: text("country_name").notNull().default("Không xác định"),
  lastVisitAt: text("last_visit_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// =============================================
// AFFILIATE SYSTEM
// =============================================

/** Tracks referral links: referrer invited referee */
export const affiliateReferrals = sqliteTable("affiliate_referrals", {
  id: int("id").primaryKey({ autoIncrement: true }),
  referrerId: int("referrer_id").notNull(),       // người giới thiệu
  refereeId: int("referee_id").notNull().unique(), // người được giới thiệu
  referralCode: text("referral_code").notNull(),   // mã ref của referrer
  expiresAt: text("expires_at").notNull(),          // referrerId nhận hoa hồng đến ngày này
  createdAt: text("created_at").notNull(),
});

/** Commission payouts from deposits of referred users */
export const affiliateCommissions = sqliteTable("affiliate_commissions", {
  id: int("id").primaryKey({ autoIncrement: true }),
  referrerId: int("referrer_id").notNull(),     // người nhận hoa hồng
  refereeId: int("referee_id").notNull(),        // người nạp tiền
  depositTxId: int("deposit_tx_id").notNull(),   // wallet_transactions.id của khoản nạp
  depositAmount: real("deposit_amount").notNull(),
  commissionRate: real("commission_rate").notNull().default(0.01), // 1%
  commissionAmount: real("commission_amount").notNull(),
  status: text("status").notNull().default("pending"), // pending | paid | expired
  paidAt: text("paid_at"),
  createdAt: text("created_at").notNull(),
});
