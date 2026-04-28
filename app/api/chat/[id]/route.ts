
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatConversations, chatMessages } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import auth from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Yêu cầu xác thực" }, { status: 401 });
    }

    const userId = Number(session?.user?.id || 0);
    const userRole = String(session?.user?.role || "user");
    const conversationId = Number(id);

    if (!conversationId) {
      return NextResponse.json({ error: "Thiếu ID hội thoại" }, { status: 400 });
    }

    const conversation = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy hội thoại" }, { status: 404 });
    }

    const conv = conversation[0];
    const hasAccess =
      userRole === "admin" ||
      conv.participantId === userId ||
      conv.adminId === userId;

    if (!hasAccess) {
      return NextResponse.json({ error: "Truy cập bị từ chối" }, { status: 403 });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    if (userRole === "admin" || conv.adminId === userId) {
      await db
        .update(chatConversations)
        .set({ unreadCount: 0 })
        .where(eq(chatConversations.id, conversationId));
    }

    return NextResponse.json({ conversation: conv, messages }, { status: 200 });
  } catch (error) {
    console.error("Lỗi tải tin nhắn:", error);
    return NextResponse.json({ error: "Không thể tải tin nhắn" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Yêu cầu xác thực" }, { status: 401 });
    }

    const userId = Number(session?.user?.id || 0);
    const userRole = String(session?.user?.role || "user");
    const conversationId = Number(id);
    const body = await req.json();
    const { content } = body;
    const now = new Date().toISOString();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Nội dung tin nhắn là bắt buộc" }, { status: 400 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: "Thiếu ID hội thoại" }, { status: 400 });
    }

    const conversation = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy hội thoại" }, { status: 404 });
    }

    const conv = conversation[0];
    const hasAccess =
      userRole === "admin" ||
      conv.participantId === userId ||
      conv.adminId === userId;

    if (!hasAccess) {
      return NextResponse.json({ error: "Truy cập bị từ chối" }, { status: 403 });
    }

    const userName = String(session?.user?.name || "");
    const senderRole = userRole === "admin" ? "admin" : "user";

    await db.insert(chatMessages).values({
      conversationId,
      senderId: userId,
      senderName: userName,
      senderRole,
      content: content.trim(),
      isRead: false,
      createdAt: now,
    });

    const unreadIncrement = userRole === "admin" ? 1 : 0;

    await db
      .update(chatConversations)
      .set({
        lastMessage: content.trim(),
        lastMessageAt: now,
        unreadCount: sql`unread_count + ${unreadIncrement}`,
        updatedAt: now,
      })
      .where(eq(chatConversations.id, conversationId));

    const updatedMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    return NextResponse.json(
      { message: updatedMessages[updatedMessages.length - 1] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi gửi tin nhắn:", error);
    return NextResponse.json({ error: "Không thể gửi tin nhắn" }, { status: 500 });
  }
}