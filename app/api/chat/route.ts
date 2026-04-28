
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatConversations, chatMessages } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import auth from "@/auth";
import { ensureDatabaseReady } from "@/lib/bootstrap";

export async function GET() {
  try {
    await ensureDatabaseReady();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ conversations: [] }, { status: 200 });
    }

    const userId = Number(session?.user?.id || 0);
    const userRole = String(session?.user?.role || "user");

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
    return NextResponse.json({ error: "Không thể tải danh sách hội thoại" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Yêu cầu xác thực" }, { status: 401 });
    }

    const userId = Number(session?.user?.id || 0);
    const userRole = String(session?.user?.role || "user");
    const body = await req.json();

    const { message, participantName, participantEmail } = body;
    const now = new Date().toISOString();

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Nội dung tin nhắn là bắt buộc" }, { status: 400 });
    }

    let conversationId: number | null = null;
    const existing = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.participantId, userId),
          eq(chatConversations.type, "user_admin")
        )
      );

    if (existing.length > 0) {
      conversationId = existing[0].id;
    } else {
      const assignedAdminId = userRole === "admin" ? userId : 1;

      const result = await db
        .insert(chatConversations)
        .values({
          participantId: userId,
          participantName: participantName || "",
          participantEmail: participantEmail || "",
          adminId: assignedAdminId,
          type: "user_admin",
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
      senderName: participantName || "",
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
    console.error("Lỗi tạo hội thoại:", error);
    return NextResponse.json({ error: "Không thể gửi tin nhắn" }, { status: 500 });
  }
}
