export const runtime = 'edge';

import { and, eq } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { productBumps, sellerProfiles, wallets, walletTransactions } from "@/lib/schema";
import { getRequestId, logApiError } from "@/lib/observability";

const BUMP_FEE = 2;

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const sellerId = Number(sessionUser.id);
    const body = await request.json();
    const productId = String(body?.productId || "").trim();

    if (!productId) {
      return badRequest("Thiếu productId", { requestId });
    }

    const profileRows = await db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, sellerId));

    const profile = profileRows[0];
    if (!profile || !profile.canSell) {
      return badRequest("Seller chưa đủ điều kiện bán hoặc chưa KYC", { requestId });
    }

    const nowIso = new Date().toISOString();

    await db.transaction(async (tx) => {
      const walletRows = await tx.select().from(wallets).where(eq(wallets.userId, sellerId));
      const wallet = walletRows[0];

      if (!wallet || wallet.balance < BUMP_FEE) {
        throw new Error("INSUFFICIENT_WALLET_BALANCE");
      }

      const nextBalance = Number((wallet.balance - BUMP_FEE).toFixed(2));
      await tx
        .update(wallets)
        .set({ balance: nextBalance, updatedAt: nowIso })
        .where(eq(wallets.id, wallet.id));

      await tx.insert(productBumps).values({
        sellerId,
        productId,
        fee: BUMP_FEE,
        bumpedAt: nowIso,
        createdAt: nowIso,
      });

      await tx.insert(walletTransactions).values({
        userId: sellerId,
        type: `product_bump:${productId}`,
        amount: BUMP_FEE,
        status: "success",
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    });

    return ok({ message: "Bump sản phẩm thành công", requestId });
  } catch (error) {
    if (String(error).includes("INSUFFICIENT_WALLET_BALANCE")) {
      return badRequest("Số dư ví không đủ để bump sản phẩm", { requestId });
    }

    logApiError({ requestId, route: "POST /api/seller/bump", message: "Không thể bump sản phẩm", error });
    return serverError("Không thể bump sản phẩm", { requestId });
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized("Không được phép truy cập", { requestId });
    }

    const sellerId = Number(sessionUser.id);

    const rows = await db
      .select()
      .from(productBumps)
      .where(eq(productBumps.sellerId, sellerId));

    return ok({ data: rows, requestId });
  } catch (error) {
    logApiError({ requestId, route: "GET /api/seller/bump", message: "Không thể lấy lịch sử bump", error });
    return serverError("Không thể lấy lịch sử bump", { requestId });
  }
}
