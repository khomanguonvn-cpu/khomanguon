
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatConversations, chatMessages, users } from "@/lib/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import auth from "@/auth";
import { ensureDatabaseReady } from "@/lib/bootstrap";

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    const session = await auth();
    const userRole = String(session?.user?.role || "user");

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Yêu cầu quyền quản trị viên" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const offset = (page - 1) * limit;

    let query = db
      .select()
      .from(chatConversations)
      .orderBy(desc(chatConversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    const allConvs = await db
      .select()
      .from(chatConversations)
      .orderBy(desc(chatConversations.lastMessageAt));

    let filtered = allConvs;
    if (status && status !== "all") {
      filtered = allConvs.filter((c) => c.status === status);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json(
      { conversations: paginated, total, page, limit },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi tải hội thoại quản trị:", error);
    return NextResponse.json({ error: "Không thể tải danh sách hội thoại" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    const session = await auth();
    const userId = Number(session?.user?.id || 0);
    const userRole = String(session?.user?.role || "user");

    if (userRole !== "admin") {
      return NextResponse.json({ error: "Yêu cầu quyền quản trị viên" }, { status: 403 });
    }

    const body = await req.json();
    const { action, conversationId, participantId } = body;

    if (action === "close") {
      await db
        .update(chatConversations)
        .set({ status: "closed", aiEnabled: true, updatedAt: new Date().toISOString() })
        .where(eq(chatConversations.id, conversationId));
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "reopen") {
      await db
        .update(chatConversations)
        .set({ status: "open", updatedAt: new Date().toISOString() })
        .where(eq(chatConversations.id, conversationId));
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "delete") {
      await db
        .delete(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId));
      await db
        .delete(chatConversations)
        .where(eq(chatConversations.id, conversationId));
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "assign") {
      await db
        .update(chatConversations)
        .set({
          adminId: userId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(chatConversations.id, conversationId));
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error) {
    console.error("Lỗi thao tác chat quản trị:", error);
    return NextResponse.json({ error: "Không thể thực hiện hành động" }, { status: 500 });
  }
}
