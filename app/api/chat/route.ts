import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatConversations, chatMessages } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import auth from "@/auth";
import { ensureDatabaseReady } from "@/lib/bootstrap";

function normalizeRole(role: unknown) {
  return String(role || "user").trim().toLowerCase();
}

export async function GET() {
  try {
    await ensureDatabaseReady();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ conversations: [] }, { status: 200 });
    }

    const userId = Number(session.user.id || 0);
    const userRole = normalizeRole(session.user.role);

    let conversations;
    if (userRole === "admin") {
      conversations = await db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.adminId, userId))
        .orderBy(desc(chatConversations.lastMessageAt));
    } else {
      conversations = await db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.participantId, userId),
            eq(chatConversations.type, "user_admin")
          )
        )
        .orderBy(desc(chatConversations.lastMessageAt));
    }

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Lỗi tải hội thoại:", error);
    return NextResponse.json(
      { error: "Không thể tải danh sách hội thoại" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Yêu cầu xác thực" }, { status: 401 });
    }

    const userId = Number(session.user.id || 0);
    const userRole = normalizeRole(session.user.role);
    const body = await req.json();
    const content = String(body?.message || "").trim();
    const participantName = String(
      body?.participantName || session.user.name || ""
    ).trim();
    const participantEmail = String(
      body?.participantEmail || session.user.email || ""
    ).trim();
    const now = new Date().toISOString();

    if (!content) {
      return NextResponse.json(
        { error: "Nội dung tin nhắn là bắt buộc" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.participantId, userId),
          eq(chatConversations.type, "user_admin")
        )
      );

    let conversationId: number | null = null;
    let isExistingConversation = false;

    if (existing.length > 0) {
      conversationId = existing[0].id;
      isExistingConversation = true;
    } else {
      const assignedAdminId = userRole === "admin" ? userId : 1;

      const result = await db
        .insert(chatConversations)
        .values({
          participantId: userId,
          participantName,
          participantEmail,
          adminId: assignedAdminId,
          type: "user_admin",
          status: "open",
          lastMessage: content,
          lastMessageAt: now,
          unreadCount: userRole === "admin" ? 0 : 1,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      conversationId = result[0]?.id;
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "Không thể tạo hội thoại" },
        { status: 500 }
      );
    }

    const senderRole = userRole === "admin" ? "admin" : "user";

    await db.insert(chatMessages).values({
      conversationId,
      senderId: userId,
      senderName: participantName,
      senderRole,
      content,
      isRead: false,
      createdAt: now,
    });

    if (isExistingConversation) {
      await db
        .update(chatConversations)
        .set({
          lastMessage: content,
          lastMessageAt: now,
          unreadCount:
            senderRole === "user" ? sql`unread_count + 1` : sql`unread_count`,
          updatedAt: now,
        })
        .where(eq(chatConversations.id, conversationId));
    }

    let shouldAiReply = senderRole === "user";
    if (isExistingConversation && (existing[0] as any).aiEnabled === false) {
      shouldAiReply = false;
    }

    if (shouldAiReply) {
      const { processAiAutoReply } = await import("@/lib/chat-ai");
      await processAiAutoReply(conversationId, content);
    }

    const updated = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);

    const updatedMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    return NextResponse.json(
      {
        conversation: updated[0],
        messages: updatedMessages,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi tạo hội thoại:", error);
    return NextResponse.json(
      { error: "Không thể gửi tin nhắn" },
      { status: 500 }
    );
  }
}
