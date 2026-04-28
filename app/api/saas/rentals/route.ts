
import { and, desc, eq, lte } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { saasRentals, wallets, walletTransactions } from "@/lib/schema";
import { getRequestId, logApiError } from "@/lib/observability";

function getBillingCycleDays(moduleName: string) {
  if (moduleName === "sms_otp_rental") return 30;
  if (moduleName === "telegram_bot_rental") return 30;
  return 30;
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) return unauthorized("Không được phép truy cập", { requestId });

    const userId = Number(sessionUser.id);
    const rows = await db
      .select()
      .from(saasRentals)
      .where(eq(saasRentals.userId, userId))
      .orderBy(desc(saasRentals.createdAt));

    return ok({ data: rows, requestId });
  } catch (error) {
    logApiError({ requestId, route: "GET /api/saas/rentals", message: "Không thể liệt kê dữ liệu thuê", error });
    return serverError("Không thể lấy danh sách rentals", { requestId });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) return unauthorized("Không được phép truy cập", { requestId });

    const userId = Number(sessionUser.id);
    const body = await request.json();
    const rentalModule = String(body?.module || "").trim();
    const planName = String(body?.planName || "").trim();
    const amount = Number(body?.amount);

    if (!["sms_otp_rental", "telegram_bot_rental"].includes(rentalModule) || !planName || !Number.isFinite(amount) || amount <= 0) {
      return badRequest("Dữ liệu rental không hợp lệ", { requestId });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const cycleDays = getBillingCycleDays(rentalModule);
    const nextBillingAt = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000).toISOString();

    await db.transaction(async (tx) => {
      const walletRows = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      const wallet = walletRows[0];
      if (!wallet || wallet.balance < amount) throw new Error("INSUFFICIENT_WALLET_BALANCE");

      await tx
        .update(wallets)
        .set({ balance: Number((wallet.balance - amount).toFixed(2)), updatedAt: nowIso })
        .where(eq(wallets.id, wallet.id));

      await tx.insert(saasRentals).values({
        userId,
        module: rentalModule,
        planName,
        amount,
        billingCycleDays: cycleDays,
        status: "active",
        nextBillingAt,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await tx.insert(walletTransactions).values({
        userId,
        type: `saas_rental:${rentalModule}`,
        amount,
        status: "success",
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    });

    return ok({ message: "Đăng ký SaaS rental thành công", requestId });
  } catch (error) {
    if (String(error).includes("INSUFFICIENT_WALLET_BALANCE")) {
      return badRequest("Số dư ví không đủ", { requestId });
    }

    logApiError({ requestId, route: "POST /api/saas/rentals", message: "Không thể tạo yêu cầu thuê", error });
    return serverError("Không thể đăng ký rental", { requestId });
  }
}

export async function PUT(request: Request) {
  const requestId = getRequestId(request);
  try {
    await ensureDatabaseReady();

    const cronSecret = request.headers.get("x-cron-secret") || "";
    if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
      return unauthorized("Truy cập bị từ chối", { requestId });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const dueRentals = await db
      .select()
      .from(saasRentals)
      .where(and(eq(saasRentals.status, "active"), lte(saasRentals.nextBillingAt, nowIso)));

    let renewed = 0;
    let cancelled = 0;

    for (const rental of dueRentals) {
      await db.transaction(async (tx) => {
        const walletRows = await tx.select().from(wallets).where(eq(wallets.userId, rental.userId));
        const wallet = walletRows[0];

        if (!wallet || wallet.balance < rental.amount) {
          await tx
            .update(saasRentals)
            .set({ status: "past_due", updatedAt: nowIso })
            .where(eq(saasRentals.id, rental.id));
          cancelled += 1;
          return;
        }

        const nextBillingAt = new Date(
          now.getTime() + rental.billingCycleDays * 24 * 60 * 60 * 1000
        ).toISOString();

        await tx
          .update(wallets)
          .set({ balance: Number((wallet.balance - rental.amount).toFixed(2)), updatedAt: nowIso })
          .where(eq(wallets.id, wallet.id));

        await tx
          .update(saasRentals)
          .set({ nextBillingAt, updatedAt: nowIso })
          .where(eq(saasRentals.id, rental.id));

        await tx.insert(walletTransactions).values({
          userId: rental.userId,
          type: `saas_renewal:${rental.module}`,
          amount: rental.amount,
          status: "success",
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        renewed += 1;
      });
    }

    return ok({ message: "Đã chạy billing cycle", renewed, cancelled, requestId });
  } catch (error) {
    logApiError({ requestId, route: "PUT /api/saas/rentals", message: "Không thể chạy chu kỳ thanh toán", error });
    return serverError("Không thể chạy billing cycle", { requestId });
  }
}
