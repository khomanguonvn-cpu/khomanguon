import { getNewsAiConfig } from "@/lib/news-ai-config";
import { db } from "@/lib/db";
import { chatMessages, chatConversations } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function processAiAutoReply(conversationId: number, userMessage: string) {
  try {
    const config = await getNewsAiConfig();
    const apiKey = config.mistralApiKey;
    if (!apiKey) {
      console.warn("No Mistral API key found for auto-reply");
      return;
    }

    const systemPrompt = `Bạn là AI KHOMANGUON, một trợ lý ảo hỗ trợ khách hàng của nền tảng KhoMaNguon.IO.VN (Kho Mã Nguồn).
Nhiệm vụ của bạn là hỗ trợ, tư vấn và giải đáp thắc mắc liên quan đến dịch vụ của hệ thống (mua bán source code, tài khoản AI, v.v.).
BẮT BUỘC: Bạn CHỈ trả lời các câu hỏi hoặc nội dung liên quan đến Kho Ma Nguon và dịch vụ phần mềm. Nếu khách hàng hỏi bất cứ thứ gì ngoài chủ đề này (như chính trị, thời tiết, toán học, sức khỏe...), hãy từ chối một cách lịch sự và hướng họ quay lại với chủ đề nền tảng.
Bạn trả lời ngắn gọn, thân thiện và chuyên nghiệp.`;

    const requestBody = {
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    };

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error("Mistral API error:", await response.text());
      return;
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) return;

    const aiNow = new Date().toISOString();
    await db.insert(chatMessages).values({
      conversationId,
      senderId: 0,
      senderName: "AI KHOMANGUON",
      senderRole: "admin",
      content: aiContent,
      isRead: false,
      createdAt: aiNow,
    });

    await db.update(chatConversations)
      .set({
        lastMessage: aiContent,
        lastMessageAt: aiNow,
        unreadCount: sql`unread_count + 1`,
        updatedAt: aiNow,
      })
      .where(eq(chatConversations.id, conversationId));

  } catch (error) {
    console.error("Failed to auto-reply with AI:", error);
  }
}
