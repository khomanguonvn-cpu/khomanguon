import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatConversations, chatMessages } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import auth from "@/auth";
import { ensureDatabaseReady } from "@/lib/bootstrap";

function normalizeRole(role: unknown) {
  return String(role || "user").trim().toLowerCase();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseReady();
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Yêu cầu xác thực" }, { status: 401 });
    }

    const userId = Number(session.user.id || 0);
    const userRole = normalizeRole(session.user.role);
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
      return NextResponse.json(
        { error: "Không tìm thấy hội thoại" },
        { status: 404 }
      );
    }

    const conv = conversation[0];
    const hasAccess =
      userRole === "admin" ||
      conv.participantId === userId ||
      conv.adminId === userId;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Truy cập bị từ chối" },
        { status: 403 }
      );
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
    return NextResponse.json(
      { error: "Không thể tải tin nhắn" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseReady();
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Yêu cầu xác thực" }, { status: 401 });
    }

    const userId = Number(session.user.id || 0);
    const userRole = normalizeRole(session.user.role);
    const conversationId = Number(id);
    const body = await req.json();
    const content = String(body?.content || "").trim();
    const now = new Date().toISOString();

    if (!content) {
      return NextResponse.json(
        { error: "Nội dung tin nhắn là bắt buộc" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Không tìm thấy hội thoại" },
        { status: 404 }
      );
    }

    const conv = conversation[0];
    const hasAccess =
      userRole === "admin" ||
      conv.participantId === userId ||
      conv.adminId === userId;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Truy cập bị từ chối" },
        { status: 403 }
      );
    }

    const userName = String(session.user.name || "");
    const senderRole = userRole === "admin" ? "admin" : "user";
    const shouldAutoReply = senderRole === "user" && conv.type === "user_admin";

    await db.insert(chatMessages).values({
      conversationId,
      senderId: userId,
      senderName: userName,
      senderRole,
      content,
      isRead: false,
      createdAt: now,
    });

    const updateData: any = {
      lastMessage: content,
      lastMessageAt: now,
      unreadCount: shouldAutoReply ? sql`unread_count + 1` : sql`unread_count`,
      updatedAt: now,
    };

    if (senderRole === "admin") {
      updateData.aiEnabled = false;
    }

    await db
      .update(chatConversations)
      .set(updateData)
      .where(eq(chatConversations.id, conversationId));

    if (shouldAutoReply && (conv as any).aiEnabled !== false) {
      const { processAiAutoReply } = await import("@/lib/chat-ai");
      await processAiAutoReply(conversationId, content);
    }

    const updatedMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    return NextResponse.json(
      {
        messages: updatedMessages,
        message: updatedMessages[updatedMessages.length - 1],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi gửi tin nhắn:", error);
    return NextResponse.json(
      { error: "Không thể gửi tin nhắn" },
      { status: 500 }
    );
  }
}
