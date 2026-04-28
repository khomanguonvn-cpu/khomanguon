import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatConversations, chatMessages, sellerProducts } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import auth from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = Number(session?.user?.id || 0);

    const conversations = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.participantId, userId),
          eq(chatConversations.type, "user_seller")
        )
      )
      .orderBy(desc(chatConversations.lastMessageAt));

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Lỗi tải hội thoại người bán:", error);
    return NextResponse.json({ error: "Không thể tải danh sách hội thoại" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = Number(session?.user?.id || 0);
    const body = await req.json();
    const { sellerId, productId, message } = body;
    const now = new Date().toISOString();

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Nội dung tin nhắn là bắt buộc" }, { status: 400 });
    }

    if (!sellerId) {
      return NextResponse.json({ error: "Thiếu ID người bán" }, { status: 400 });
    }

    const userName = String(session?.user?.name || "");

    const existing = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.participantId, userId),
          eq(chatConversations.adminId, Number(sellerId)),
          eq(chatConversations.type, "user_seller")
        )
      );

    let conversationId: number | null = null;

    if (existing.length > 0) {
      conversationId = existing[0].id;
    } else {
      const result = await db
        .insert(chatConversations)
        .values({
          participantId: userId,
          participantName: userName,
          participantEmail: String(session?.user?.email || ""),
          adminId: Number(sellerId),
          type: "user_seller",
          status: "open",
          lastMessage: message.trim(),
          lastMessageAt: now,
          unreadCount: 1,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      conversationId = result[0]?.id;
    }

    if (!conversationId) {
      return NextResponse.json({ error: "Không thể tạo hội thoại" }, { status: 500 });
    }

    await db.insert(chatMessages).values({
      conversationId,
      senderId: userId,
      senderName: userName,
      senderRole: "user",
      content: message.trim(),
      isRead: false,
      createdAt: now,
    });

    const updated = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);

    return NextResponse.json({ conversation: updated[0] }, { status: 201 });
  } catch (error) {
    console.error("Lỗi tạo hội thoại người bán:", error);
    return NextResponse.json({ error: "Không thể gửi tin nhắn" }, { status: 500 });
  }
}
