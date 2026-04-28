import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sellerProfiles } from "@/lib/schema";

const TELEGRAM_API_BASE = "https://api.telegram.org";

type OrderNotificationInput = {
  orderItemId?: number;
  orderId: number;
  productName: string;
  variantLabel: string;
  qty: number;
  price: number;
  productType: string;
  buyerEmail: string;
  autoRefundAt?: string | null;
  siteUrl: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function formatDeadline(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export async function getSellerTelegramConfig(sellerId: number) {
  const rows = await db
    .select()
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, sellerId));

  const seller = rows[0];
  if (!seller) {
    return null;
  }

  const botToken = String(seller.telegramBotToken || "").trim();
  const chatId = String(seller.telegramChatId || "").trim();

  if (!botToken || !chatId) {
    return null;
  }

  return { botToken, chatId };
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
) {
  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        ok: false,
        reason: `HTTP_${response.status}`,
        detail: body,
      };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "FETCH_ERROR", detail: String(error) };
  }
}

export async function verifySellerTelegramBot(
  botToken: string,
  chatId: string
) {
  const testMessage = [
    "✅ <b>Xác minh thành công!</b>",
    "",
    "Bot Telegram của bạn đã được kết nối với hệ thống KHOMANGUON.",
    "Bạn sẽ nhận thông báo tại đây khi có đơn hàng mới.",
  ].join("\n");

  return sendTelegramMessage(botToken, chatId, testMessage);
}

export async function sendSellerOrderNotification(
  sellerId: number,
  input: OrderNotificationInput
) {
  const config = await getSellerTelegramConfig(sellerId);
  if (!config) {
    return { ok: false, reason: "TELEGRAM_NOT_CONFIGURED" };
  }

  const productTypeLabel =
    input.productType === "ai_account"
      ? "Tài khoản AI"
      : input.productType === "source_code"
        ? "Mã nguồn"
        : input.productType === "service"
          ? "Dịch vụ"
          : input.productType === "physical"
            ? "Sản phẩm vật lý"
            : "Sản phẩm số";

  const baseSiteUrl = String(input.siteUrl || "").trim().replace(/\/+$/, "");
  const ordersUrl = `${baseSiteUrl || "http://localhost:3000"}/account/seller/orders`;
  const hasFulfillmentDeadline = Boolean(input.autoRefundAt);
  const actionLabel = hasFulfillmentDeadline ? "Trả đơn tại" : "Xem đơn tại";

  const text = [
    `🛒 <b>ĐƠN HÀNG MỚI #${input.orderId}</b>`,
    "──────────────",
    `📦 <b>Sản phẩm:</b> ${escapeHtml(input.productName)}`,
    input.variantLabel ? `🏷 <b>Biến thể:</b> ${escapeHtml(input.variantLabel)}` : "",
    `🔢 <b>Số lượng:</b> ${input.qty}`,
    `💰 <b>Giá:</b> ${formatCurrency(input.price)}`,
    `📂 <b>Loại:</b> ${productTypeLabel}`,
    `👤 <b>Người mua:</b> ${escapeHtml(maskEmail(input.buyerEmail))}`,
    hasFulfillmentDeadline
      ? `⏰ <b>Hạn trả đơn:</b> ${formatDeadline(String(input.autoRefundAt))}`
      : "",
    "──────────────",
    `👉 <b>${actionLabel}:</b> ${ordersUrl}`,
    hasFulfillmentDeadline
      ? "⚠️ Nếu không trả đơn trong 24h, hệ thống sẽ tự động hoàn tiền cho người mua."
      : "ℹ️ Đơn này không yêu cầu trả đơn thủ công, bạn có thể theo dõi trong trang quản lý đơn.",
  ]
    .filter(Boolean)
    .join("\n");

  return sendTelegramMessage(config.botToken, config.chatId, text);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function maskEmail(email: string) {
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const localPart = parts[0];
  if (localPart.length <= 2) return `${localPart[0]}***@${parts[1]}`;
  return `${localPart.slice(0, 2)}***@${parts[1]}`;
}
