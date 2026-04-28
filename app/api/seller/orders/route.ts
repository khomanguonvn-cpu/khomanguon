import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  escrowTransactions,
  orderItems,
  orders,
  productSubcategories,
  sellerFulfillments,
  sellerProducts,
  wallets,
  walletTransactions,
} from "@/lib/schema";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { requireSessionUser } from "@/lib/api-auth";
import { encryptSellerSecureDelivery } from "@/lib/secure-delivery";

type SellerOrderProduct = Record<string, unknown> & {
  name?: string;
  sellerProductId?: number | string;
  product?: number | string;
  option?: string;
  qty?: number | string;
  price?: number | string;
  productType?: string;
  selectedVariantId?: string;
  accountVariant?: Record<string, unknown>;
  attributes?: Array<{ key?: string; value?: unknown }>;
};

type SupportedProductType =
  | "physical"
  | "digital"
  | "ai_account"
  | "source_code"
  | "service";

function normalizePaymentMethod(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "wallet" || normalized === "wallet_balance" || normalized === "walletbalance") {
    return "wallet";
  }

  if (
    normalized === "cash_on_delivery" ||
    normalized === "cod" ||
    normalized === "cashondelivery"
  ) {
    return "cash_on_delivery";
  }

  if (
    normalized === "payos" ||
    normalized === "credit_card" ||
    normalized === "stripe" ||
    normalized === "paypal" ||
    normalized === "bank_transfer" ||
    normalized === "online_payment" ||
    normalized === "card"
  ) {
    return "payos";
  }

  return normalized;
}

function isOrderReadyForFulfillment(order: typeof orders.$inferSelect) {
  const paymentStatus = String(order.paymentStatus || "").trim().toLowerCase();
  const paymentMethod = normalizePaymentMethod(order.paymentMethod);
  return paymentStatus === "paid" || paymentMethod === "wallet";
}

function parseOrderProducts(rawProductsJson: string) {
  try {
    const parsed = JSON.parse(rawProductsJson || "[]");
    return Array.isArray(parsed) ? (parsed as SellerOrderProduct[]) : [];
  } catch {
    return [];
  }
}

function normalizeProductType(
  value: unknown,
  fallbackDeliveryMethod?: unknown
): SupportedProductType {
  const normalized = String(value || fallbackDeliveryMethod || "digital")
    .trim()
    .toLowerCase();

  if (normalized === "physical") return "physical";
  if (normalized === "ai_account") return "ai_account";
  if (normalized === "source_code") return "source_code";
  if (normalized === "service") return "service";
  return "digital";
}

function normalizeListingMode(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function hasAttributeKey(input: unknown, keys: string[]) {
  if (!Array.isArray(input) || keys.length === 0) {
    return false;
  }

  const expected = new Set(keys.map((key) => key.toLowerCase()));
  return input.some((item) => {
    const key = String((item as { key?: unknown })?.key || "")
      .trim()
      .toLowerCase();
    return key.length > 0 && expected.has(key);
  });
}

function inferFulfillmentProductType(params: {
  requestedType?: unknown;
  deliveryMethod?: unknown;
  listingMode?: unknown;
  itemPayload?: Record<string, unknown>;
}): SupportedProductType {
  const { requestedType, deliveryMethod, listingMode, itemPayload } = params;
  const directType = normalizeProductType(requestedType, deliveryMethod);

  if (
    directType === "ai_account" ||
    directType === "source_code" ||
    directType === "service" ||
    directType === "physical"
  ) {
    return directType;
  }

  const listingModeNormalized = normalizeListingMode(listingMode);
  if (listingModeNormalized === "digital_account") {
    return "ai_account";
  }
  if (listingModeNormalized === "digital_license") {
    return "source_code";
  }
  if (listingModeNormalized === "service_package") {
    return "service";
  }

  const accountVariant = itemPayload?.accountVariant;
  if (accountVariant && typeof accountVariant === "object") {
    return "ai_account";
  }

  if (hasAttributeKey(itemPayload?.attributes, ["accountType", "durationDays"])) {
    return "ai_account";
  }

  if (
    hasAttributeKey(itemPayload?.attributes, [
      "licenseType",
      "framework",
      "stack",
      "projectType",
    ])
  ) {
    return "source_code";
  }

  return directType;
}

function requiresManualFulfillment(productType: SupportedProductType) {
  return productType === "ai_account" || productType === "source_code";
}

function makeOrderItemKey(orderId: number, sellerProductId: number, variantLabel: string) {
  return `${orderId}:${sellerProductId}:${String(variantLabel || "").trim().toLowerCase()}`;
}

function createBackfillDeadline(orderCreatedAt: string) {
  const now = Date.now();
  const fallbackDeadline = now + 24 * 60 * 60 * 1000;
  const createdAtMs = new Date(orderCreatedAt).getTime();

  if (!Number.isFinite(createdAtMs)) {
    return new Date(fallbackDeadline).toISOString();
  }

  return new Date(Math.max(fallbackDeadline, createdAtMs + 24 * 60 * 60 * 1000)).toISOString();
}

async function ensureMissingOrderItemsForSeller(params: {
  sellerId: number;
  sellerProductMap: Map<number, typeof sellerProducts.$inferSelect>;
  subcategoryModeMap: Map<number, string>;
}) {
  const { sellerId, sellerProductMap, subcategoryModeMap } = params;

  const existingItemRows = await db
    .select({
      orderId: orderItems.orderId,
      sellerProductId: orderItems.sellerProductId,
      variantLabel: orderItems.variantLabel,
    })
    .from(orderItems)
    .where(eq(orderItems.sellerId, sellerId));

  const existingKeys = new Set(
    existingItemRows.map((item) =>
      makeOrderItemKey(item.orderId, item.sellerProductId, item.variantLabel || "")
    )
  );

  const orderRows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  const nowIso = new Date().toISOString();
  const inserts: Array<typeof orderItems.$inferInsert> = [];

  for (const order of orderRows) {
    if (!isOrderReadyForFulfillment(order)) {
      continue;
    }

    const products = parseOrderProducts(order.productsJson);
    for (const product of products) {
      const sellerProductId = Number(product.sellerProductId || product.product || 0);
      if (!Number.isFinite(sellerProductId) || sellerProductId <= 0) {
        continue;
      }

      const sellerProduct = sellerProductMap.get(sellerProductId);
      if (!sellerProduct) {
        continue;
      }

      const variantLabel = String(product.option || product.selectedVariantId || "").trim();
      const key = makeOrderItemKey(order.id, sellerProductId, variantLabel);
      if (existingKeys.has(key)) {
        continue;
      }

      const productType = inferFulfillmentProductType({
        requestedType: product.productType,
        deliveryMethod: sellerProduct.deliveryMethod,
        listingMode: subcategoryModeMap.get(sellerProduct.subcategoryId),
        itemPayload: product,
      });
      if (!requiresManualFulfillment(productType)) {
        continue;
      }

      const qty = Math.max(1, Number(product.qty || 1));
      const price = Math.max(0, Number(product.price || 0));

      inserts.push({
        orderId: order.id,
        sellerId,
        buyerId: order.userId,
        sellerProductId,
        productName: String(product.name || sellerProduct.name || "").trim(),
        variantLabel,
        qty,
        price,
        productType,
        fulfillmentStatus: "pending",
        fulfilledDataJson: "{}",
        autoRefundAt: createBackfillDeadline(order.createdAt),
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      existingKeys.add(key);
    }
  }

  if (inserts.length > 0) {
    await db.insert(orderItems).values(inserts);
  }

  return inserts.length;
}

export async function GET(request: Request) {
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    const sellerId = Number(sessionUser.id);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
    const offset = (page - 1) * limit;

    const sellerProductsFullRows = await db
      .select()
      .from(sellerProducts)
      .where(eq(sellerProducts.sellerId, sellerId));

    if (sellerProductsFullRows.length === 0) {
      return ok({
        data: [],
        pendingCount: 0,
        pagination: { page, limit, total: 0, totalPages: 1 },
      });
    }

    const sellerProductMap = new Map(sellerProductsFullRows.map((item) => [item.id, item]));

    const subcategoryIds = Array.from(
      new Set(
        sellerProductsFullRows
          .map((item) => Number(item.subcategoryId))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );
    const subcategoryRows =
      subcategoryIds.length > 0
        ? await db
            .select({
              id: productSubcategories.id,
              listingMode: productSubcategories.listingMode,
            })
            .from(productSubcategories)
            .where(inArray(productSubcategories.id, subcategoryIds))
        : [];
    const subcategoryModeMap = new Map(
      subcategoryRows.map((item) => [item.id, item.listingMode])
    );

    await ensureMissingOrderItemsForSeller({
      sellerId,
      sellerProductMap,
      subcategoryModeMap,
    });

    const itemRows = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.sellerId, sellerId))
      .orderBy(desc(orderItems.createdAt));

    if (itemRows.length === 0) {
      return ok({
        data: [],
        pendingCount: 0,
        pagination: { page, limit, total: 0, totalPages: 1 },
      });
    }

    const orderIds = Array.from(new Set(itemRows.map((item) => item.orderId)));
    const orderRows =
      orderIds.length > 0
        ? await db
            .select()
            .from(orders)
            .where(inArray(orders.id, orderIds))
        : [];
    const orderMap = new Map(orderRows.map((item) => [item.id, item]));

    const visibleItems = itemRows.filter((item) => {
      const order = orderMap.get(item.orderId);
      if (!order) return false;
      return isOrderReadyForFulfillment(order);
    });

    const pendingCount = visibleItems.filter(
      (item) => item.fulfillmentStatus === "pending"
    ).length;

    const filtered = statusFilter
      ? visibleItems.filter((item) => item.fulfillmentStatus === statusFilter)
      : visibleItems;

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = filtered.slice(offset, offset + limit).map((item) => {
      const order = orderMap.get(item.orderId);
      const isPaid = order ? isOrderReadyForFulfillment(order) : false;
      return {
        id: item.id,
        orderId: item.orderId,
        productName: item.productName,
        variantLabel: item.variantLabel,
        qty: Number(item.qty || 1),
        price: Number(item.price || 0),
        productType: String(item.productType || "digital"),
        fulfillmentStatus: item.fulfillmentStatus,
        fulfilledAt: item.fulfilledAt || null,
        autoRefundAt: item.autoRefundAt || null,
        createdAt: item.createdAt || order?.createdAt || new Date().toISOString(),
        paymentStatus: isPaid ? "paid" : order?.paymentStatus || "pending",
        isPaid,
        total: Number(order?.total || item.price * item.qty || 0),
      };
    });

    return ok({
      data: paginated,
      pendingCount,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    return serverError("Không thể lấy danh sách đơn hàng", {
      error: String(error),
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    const sellerId = Number(sessionUser.id);
    const body = await request.json();

    const orderItemId = Number(body?.orderItemId);
    if (!Number.isFinite(orderItemId) || orderItemId <= 0) {
      return badRequest("orderItemId không hợp lệ");
    }

    const itemRows = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, orderItemId));
    const item = itemRows[0];

    if (!item) {
      return badRequest("Đơn hàng không tồn tại");
    }

    const fulfillQty = Math.max(1, Number(body?.qty || 1));
    const isUnlimited = fulfillQty > Number(item.qty);

    if (item.sellerId !== sellerId) {
      return unauthorized("Bạn không có quyền trả đơn này");
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, item.orderId));
    const order = orderRows[0];
    if (!order) {
      return badRequest("Đơn hàng không tồn tại");
    }

    if (!isOrderReadyForFulfillment(order)) {
      return badRequest("Đơn hàng chưa đủ điều kiện để trả đơn");
    }

    if (item.fulfillmentStatus === "auto_refunded") {
      return badRequest("Đơn hàng đã bị hoàn tiền tự động");
    }

    if (item.autoRefundAt) {
      const deadline = new Date(item.autoRefundAt).getTime();
      if (Date.now() > deadline) {
        return badRequest("Đơn hàng đã quá hạn trả đơn (24h)");
      }
    }

    const productType = String(item.productType || "digital").trim();
    let fulfilledData: Record<string, string> = {};

    if (productType === "ai_account") {
      const username = String(body?.username || "").trim();
      const password = String(body?.password || "").trim();
      const twoFactorCode = String(body?.twoFactorCode || "").trim();

      if (!username) {
        return badRequest("Vui lòng nhập tên đăng nhập (username)");
      }
      if (!password) {
        return badRequest("Vui lòng nhập mật khẩu (password)");
      }

      fulfilledData = { username, password };
      if (twoFactorCode) {
        fulfilledData.twoFactorCode = twoFactorCode;
      }
    } else if (productType === "source_code") {
      const url = String(body?.url || "").trim();

      if (!url) {
        return badRequest("Vui lòng nhập URL bàn giao mã nguồn");
      }

      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return badRequest("URL phải bắt đầu bằng http:// hoặc https://");
        }
      } catch {
        return badRequest("URL không hợp lệ");
      }

      fulfilledData = { url };
    } else {
      return badRequest("Loại sản phẩm này không hỗ trợ trả đơn trực tuyến");
    }

    const encryptedPayload = encryptSellerSecureDelivery({
      accountCredentials:
        productType === "ai_account"
          ? [
              {
                id: `fulfill-${item.id}`,
                accountType: item.productName,
                username: fulfilledData.username || "",
                password: fulfilledData.password || "",
                note: fulfilledData.twoFactorCode
                  ? `2FA: ${fulfilledData.twoFactorCode}`
                  : "",
              },
            ]
          : [],
      sourceDownloads:
        productType === "source_code"
          ? [
              {
                id: `fulfill-${item.id}`,
                label: item.productName,
                url: fulfilledData.url || "",
                note: "",
                passwordHint: "",
              },
            ]
          : [],
    });

    const nowIso = new Date().toISOString();
    const itemTotal = Number((Number(item.price) * fulfillQty).toFixed(2));

    const existingFulfillments = await db
      .select()
      .from(sellerFulfillments)
      .where(eq(sellerFulfillments.orderItemId, orderItemId));

    const totalFulfilledQty = existingFulfillments.reduce(
      (sum, f) => sum + Number(f.qty),
      0
    );
    const remainingQty = Math.max(0, Number(item.qty) - totalFulfilledQty);

    if (!isUnlimited && fulfillQty > remainingQty && remainingQty > 0) {
      return badRequest(
        `Chỉ còn ${remainingQty} cái có thể trả. Vui lòng chọn số lượng nhỏ hơn hoặc bằng ${remainingQty}.`
      );
    }

    if (!isUnlimited && remainingQty <= 0) {
      return badRequest("Số lượng đã được trả đủ. Không thể trả thêm.");
    }

    if (isUnlimited && remainingQty <= 0) {
      return badRequest("Số lượng đã được trả đủ. Không thể trả thêm.");
    }

    await db.insert(sellerFulfillments).values({
      orderItemId,
      sellerId,
      qty: fulfillQty,
      amount: Number((Number(item.price) * fulfillQty).toFixed(2)),
      fulfilledDataJson: encryptedPayload || JSON.stringify(fulfilledData),
      createdAt: nowIso,
    });

    const newTotalFulfilledQty = totalFulfilledQty + fulfillQty;
    const isFullyFulfilled = newTotalFulfilledQty >= Number(item.qty);

    if (isFullyFulfilled) {
      await db
        .update(orderItems)
        .set({
          fulfillmentStatus: "fulfilled",
          fulfilledDataJson: encryptedPayload || JSON.stringify(fulfilledData),
          fulfilledAt: nowIso,
          updatedAt: nowIso,
        })
        .where(eq(orderItems.id, orderItemId));
    }

    try {
      await db.transaction(async (tx) => {
        const escrowRows = await tx
          .select()
          .from(escrowTransactions)
          .where(
            and(
              eq(escrowTransactions.orderId, item.orderId),
              eq(escrowTransactions.status, "held")
            )
          );

        const escrow = escrowRows[0];
        if (!escrow) {
          return;
        }

        const fulfilledSumRows = await tx
          .select({
            total: sql<number>`coalesce(sum(${sellerFulfillments.amount}), 0)`,
          })
          .from(sellerFulfillments)
          .where(eq(sellerFulfillments.orderItemId, orderItemId));

        const fulfilledAmount = Number(fulfilledSumRows[0]?.total || 0);
        const escrowAmount = Number(escrow.amount || 0);
        const payoutAmount = Math.max(
          0,
          Math.min(itemTotal, escrowAmount - fulfilledAmount + itemTotal)
        );

        if (payoutAmount > 0) {
          const sellerWalletRows = await tx
            .select()
            .from(wallets)
            .where(eq(wallets.userId, sellerId));
          const sellerWallet = sellerWalletRows[0];

          if (sellerWallet) {
            await tx
              .update(wallets)
              .set({
                balance: Number((sellerWallet.balance + payoutAmount).toFixed(2)),
                updatedAt: nowIso,
              })
              .where(eq(wallets.id, sellerWallet.id));
          } else {
            await tx.insert(wallets).values({
              userId: sellerId,
              balance: payoutAmount,
              updatedAt: nowIso,
            });
          }

          await tx.insert(walletTransactions).values({
            userId: sellerId,
            type: "order_payment_received",
            amount: payoutAmount,
            status: "success",
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }

        if (isFullyFulfilled) {
          await tx
            .update(escrowTransactions)
            .set({
              status: "released",
              settledAt: nowIso,
              updatedAt: nowIso,
            })
            .where(eq(escrowTransactions.id, escrow.id));
        }
      });
    } catch (escrowError) {
      console.error("Lỗi giải phóng escrow:", escrowError);
    }

    return ok({
      message: isFullyFulfilled
        ? "Trả đơn thành công! Tiền đã được chuyển vào ví của bạn."
        : `Trả thành công ${fulfillQty} cái! Tiền đã được chuyển vào ví.`,
    });
  } catch (error) {
    return serverError("Không thể trả đơn", {
      error: String(error),
    });
  }
}
