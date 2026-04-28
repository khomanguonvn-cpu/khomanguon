export const runtime = 'edge';

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sellerProfiles } from "@/lib/schema";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { requireSessionUser } from "@/lib/api-auth";
import { verifySellerTelegramBot } from "@/lib/seller-telegram";

export async function GET() {
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    const userId = Number(sessionUser.id);
    const rows = await db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId));

    const seller = rows[0];
    if (!seller) {
      return badRequest("Bạn chưa đăng ký bán hàng");
    }

    const botToken = String(seller.telegramBotToken || "").trim();
    const chatId = String(seller.telegramChatId || "").trim();
    const isConfigured = Boolean(botToken && chatId);

    return ok({
      data: {
        isConfigured,
        chatId: isConfigured ? chatId : "",
        botTokenPreview: isConfigured
          ? `${botToken.slice(0, 6)}...${botToken.slice(-4)}`
          : "",
      },
    });
  } catch (error) {
    return serverError("Không thể lấy cấu hình Telegram", {
      error: String(error),
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    const userId = Number(sessionUser.id);
    const rows = await db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId));

    const seller = rows[0];
    if (!seller) {
      return badRequest("Bạn chưa đăng ký bán hàng");
    }

    const body = await request.json();
    const botToken = String(body?.botToken || "").trim();
    const chatId = String(body?.chatId || "").trim();

    if (!botToken || !chatId) {
      return badRequest("Vui lòng nhập đầy đủ Bot Token và Chat ID");
    }

    if (botToken.length < 20) {
      return badRequest("Bot Token không hợp lệ");
    }

    if (!/^-?\d+$/.test(chatId)) {
      return badRequest("Chat ID phải là số (có thể âm cho group chat)");
    }

    // Verify by sending test message
    const verifyResult = await verifySellerTelegramBot(botToken, chatId);
    if (!verifyResult.ok) {
      return badRequest(
        `Không thể gửi tin nhắn đến bot. Vui lòng kiểm tra Bot Token và Chat ID. Lỗi: ${verifyResult.reason || "unknown"}`
      );
    }

    const nowIso = new Date().toISOString();

    await db
      .update(sellerProfiles)
      .set({
        telegramBotToken: botToken,
        telegramChatId: chatId,
        updatedAt: nowIso,
      })
      .where(eq(sellerProfiles.userId, userId));

    return ok({
      message: "Đã kích hoạt Telegram Bot thành công! Bạn sẽ nhận thông báo khi có đơn hàng mới.",
      data: {
        isConfigured: true,
        chatId,
        botTokenPreview: `${botToken.slice(0, 6)}...${botToken.slice(-4)}`,
      },
    });
  } catch (error) {
    return serverError("Không thể cấu hình Telegram", {
      error: String(error),
    });
  }
}

export async function DELETE() {
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    const userId = Number(sessionUser.id);
    const rows = await db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId));

    const seller = rows[0];
    if (!seller) {
      return badRequest("Bạn chưa đăng ký bán hàng");
    }

    const nowIso = new Date().toISOString();

    await db
      .update(sellerProfiles)
      .set({
        telegramBotToken: "",
        telegramChatId: "",
        updatedAt: nowIso,
      })
      .where(eq(sellerProfiles.userId, userId));

    return ok({
      message: "Đã hủy tích hợp Telegram Bot",
    });
  } catch (error) {
    return serverError("Không thể hủy tích hợp Telegram", {
      error: String(error),
    });
  }
}
