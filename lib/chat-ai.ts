import { getNewsAiConfig } from "@/lib/news-ai-config";
import { db } from "@/lib/db";
import { chatMessages, chatConversations } from "@/lib/schema";
import { eq } from "drizzle-orm";

const DEFAULT_MISTRAL_CHAT_MODEL = "mistral-small-latest";

const SYSTEM_PROMPT = `Bạn là AI KHOMANGUON, một trợ lý ảo hỗ trợ khách hàng của nền tảng KhoMaNguon.IO.VN (Kho Mã Nguồn).
Nhiệm vụ của bạn là hỗ trợ, tư vấn và giải đáp thắc mắc liên quan đến dịch vụ của hệ thống như mua bán source code, tài khoản AI, sản phẩm số và quy trình thanh toán.
BẮT BUỘC: Bạn chỉ trả lời các câu hỏi hoặc nội dung liên quan đến Kho Mã Nguồn và dịch vụ phần mềm. Nếu khách hàng hỏi nội dung ngoài chủ đề này, hãy từ chối lịch sự và hướng họ quay lại với chủ đề nền tảng.
Bạn trả lời ngắn gọn, thân thiện và chuyên nghiệp bằng tiếng Việt có dấu chuẩn xác.`;

const FALLBACK_MESSAGE =
  "Chào bạn, hệ thống AI KHOMANGUON đang gặp chút gián đoạn kết nối. Chúng tôi đã ghi nhận tin nhắn của bạn và sẽ phản hồi sớm nhất!";

function normalizeAiContent(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text || "");
        }
        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

function getChatModel(config: Awaited<ReturnType<typeof getNewsAiConfig>>) {
  const configuredModel =
    config.provider === "mistral" ? String(config.model || "").trim() : "";

  if (configuredModel && !configuredModel.toLowerCase().includes("embed")) {
    return configuredModel;
  }

  return DEFAULT_MISTRAL_CHAT_MODEL;
}

async function saveAiReply(conversationId: number, content: string) {
  const aiNow = new Date().toISOString();

  await db.insert(chatMessages).values({
    conversationId,
    senderId: 0,
    senderName: "AI KHOMANGUON",
    senderRole: "admin",
    content,
    isRead: false,
    createdAt: aiNow,
  });

  await db
    .update(chatConversations)
    .set({
      lastMessage: content,
      lastMessageAt: aiNow,
      updatedAt: aiNow,
    })
    .where(eq(chatConversations.id, conversationId));
}

export async function processAiAutoReply(conversationId: number, userMessage: string) {
  console.log(`[AI-CHAT] Starting auto reply for conv: ${conversationId}`);

  try {
    const config = await getNewsAiConfig();
    const apiKey = config.mistralApiKey;

    if (!apiKey) {
      console.warn("[AI-CHAT] No Mistral API key found");
      await saveAiReply(conversationId, FALLBACK_MESSAGE);
      return;
    }

    const requestBody = {
      model: getChatModel(config),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 320,
    };

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        "[AI-CHAT] Mistral API error:",
        response.status,
        errorText.slice(0, 500)
      );
      throw new Error(`Mistral API error ${response.status}`);
    }

    const data = await response.json();
    const aiContent =
      normalizeAiContent(data?.choices?.[0]?.message?.content) || FALLBACK_MESSAGE;

    await saveAiReply(conversationId, aiContent);
  } catch (error) {
    console.error("Failed to auto-reply with AI:", error);

    try {
      await saveAiReply(conversationId, FALLBACK_MESSAGE);
    } catch (fallbackError) {
      console.error("Critical failure in chat fallback:", fallbackError);
    }
  }
}
