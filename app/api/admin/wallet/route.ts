import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { wallets, walletTransactions, users } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ok, badRequest, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const userId = searchParams.get("userId");
    const search = searchParams.get("search") || "";

    let walletData: typeof wallets.$inferSelect[];
    let total = 0;

    if (userId) {
      walletData = await db.select().from(wallets).where(eq(wallets.userId, parseInt(userId))).orderBy(desc(wallets.updatedAt)).limit(limit).offset((page - 1) * limit);
      total = walletData.length;
    } else {
      const offset = (page - 1) * limit;
      walletData = await db.select().from(wallets).orderBy(desc(wallets.updatedAt)).limit(limit).offset(offset);
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(wallets);
      total = countResult[0]?.count || 0;
    }

    const walletsWithUser = await Promise.all(walletData.map(async (wallet) => {
      const userRows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, wallet.userId));
      return {
        ...wallet,
        user: userRows[0] || null,
      };
    }));

    const filteredData = search
      ? walletsWithUser.filter(w =>
          w.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          w.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          String(w.userId).includes(search)
        )
      : walletsWithUser;

    return ok({ 
      data: filteredData, 
      pagination: { page, totalPages: Math.ceil(total / limit), total, limit } 
    });
  } catch (error) {
    logApiError({ requestId: reqId, route: "GET /api/admin/wallet", message: "Thất bại", error });
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") return forbidden("Chỉ dành cho Quản trị viên");

    const body = await request.json();
    const { userId, amount, action, reason } = body;

    if (!userId || amount === undefined || !action) {
      return badRequest("Thiếu ID người dùng, số tiền hoặc hành động");
    }

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return badRequest("Số tiền phải lớn hơn 0");
    }

    const userIdNum = parseInt(String(userId));
    if (isNaN(userIdNum)) {
      return badRequest("ID người dùng không hợp lệ");
    }

    const nowIso = new Date().toISOString();

    // Get or create wallet
    let walletRows = await db.select().from(wallets).where(eq(wallets.userId, userIdNum));
    let wallet = walletRows[0];

    if (!wallet) {
      // Create new wallet
      const newWallet = await db.insert(wallets).values({
        userId: userIdNum,
        balance: 0,
        updatedAt: nowIso,
      }).returning();
      wallet = newWallet[0];
    }

    let newBalance: number;
    let transactionType: string;

    if (action === "add") {
      newBalance = Number((wallet.balance + numAmount).toFixed(2));
      transactionType = "admin_deposit";
    } else if (action === "deduct") {
      if (wallet.balance < numAmount) {
        return badRequest("Số dư không đủ để trừ");
      }
      newBalance = Number((wallet.balance - numAmount).toFixed(2));
      transactionType = "admin_withdraw";
    } else {
      return badRequest("Hành động không hợp lệ. Dùng 'add' hoặc 'deduct'");
    }

    // Update wallet balance
    await db.update(wallets).set({
      balance: newBalance,
      updatedAt: nowIso,
    }).where(eq(wallets.id, wallet.id));

    // Record transaction
    await db.insert(walletTransactions).values({
      userId: userIdNum,
      type: transactionType,
      amount: action === "add" ? numAmount : -numAmount,
      status: "success",
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return ok({ 
      success: true, 
      newBalance,
      message: action === "add" 
        ? `Đã cộng $${numAmount} vào số dư của user` 
        : `Đã trừ $${numAmount} khỏi số dư của user`
    });
  } catch (error) {
    logApiError({ requestId: reqId, route: "PATCH /api/admin/wallet", message: "Thất bại", error });
    return serverError();
  }
}
