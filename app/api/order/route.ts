export const runtime = 'nodejs';

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  carts,
  escrowTransactions,
  orderItems,
  orders,
  productSubcategories,
  sellerFulfillments,
  sellerProducts,
  users,
  wallets,
  walletTransactions,
} from "@/lib/schema";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { createPayOSPaymentLink } from "@/lib/payos";
import { requireSessionUser } from "@/lib/api-auth";
import { orderCreateSchema, zodDetails } from "@/lib/validators";
import { getRequestId, logApiError } from "@/lib/observability";
import {
  decryptSellerSecureDelivery,
  type SellerSecureDelivery,
} from "@/lib/secure-delivery";
import { sendSellerOrderNotification } from "@/lib/seller-telegram";

type StoredAssetItem =
  | {
      type: "image";
      url: string;
      label?: string;
    }
  | {
      type: "secure_delivery";
      payload: string;
    };

type OrderProductLike = Record<string, unknown> & {
  sellerProductId?: number | string;
  product?: number | string;
  qty?: number | string;
  productType?: string;
};

type NormalizedPaymentMethod = "wallet" | "cash_on_delivery" | "payos";
type CreateOrderProductInput = {
  sellerProductId: number;
  selectedVariantId: string;
  qty: number;
  price: number;
  name: string;
  productType?: string;
  option?: string;
  accountVariant?: Record<string, unknown>;
  attributes?: Array<{ key?: string; value?: unknown }>;
};

type SupportedProductType =
  | "physical"
  | "digital"
  | "ai_account"
  | "source_code"
  | "service";

function normalizeDeliveryInfo(order: typeof orders.$inferSelect) {
  const parsed = JSON.parse(order.shippingAddressJson || "{}");
  const fromAddress = String(parsed?.deliveryInfo || parsed?.address || "").trim();
  return fromAddress;
}

function mapShippingStatus(status: string) {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "pending" || normalized === "not processed") {
    return "pending_handover";
  }

  if (normalized === "delivered") {
    return "handed_over";
  }

  return normalized || "pending_handover";
}

function parseOrderProducts(rawProductsJson: string) {
  try {
    const parsed = JSON.parse(rawProductsJson || "[]");
    return Array.isArray(parsed) ? (parsed as OrderProductLike[]) : [];
  } catch {
    return [];
  }
}

function parseStoredAssets(rawAssetsJson: string): StoredAssetItem[] {
  try {
    const parsed = JSON.parse(rawAssetsJson || "[]");
    return Array.isArray(parsed) ? (parsed as StoredAssetItem[]) : [];
  } catch {
    return [];
  }
}

function extractSecureDelivery(rawAssetsJson: string): SellerSecureDelivery {
  const stored = parseStoredAssets(rawAssetsJson);
  const secureNode = stored.find(
    (item): item is { type: "secure_delivery"; payload: string } =>
      !!item &&
      typeof item === "object" &&
      item.type === "secure_delivery" &&
      typeof (item as { payload?: unknown }).payload === "string"
  );

  if (!secureNode) {
    return {
      accountCredentials: [],
      sourceDownloads: [],
    };
  }

  return decryptSellerSecureDelivery(secureNode.payload);
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

function normalizeListingMode(value: unknown): string {
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

function makeOrderItemLookupKey(sellerProductId: number, variantLabel: unknown) {
  return `${sellerProductId}::${String(variantLabel || "").trim().toLowerCase()}`;
}


function normalizePaymentMethod(value: unknown): NormalizedPaymentMethod | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return null;
  }

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

  return null;
}

function isWalletPaymentMethod(value: unknown) {
  return normalizePaymentMethod(value) === "wallet";
}

function isOrderPaymentSettled(order: typeof orders.$inferSelect) {
  // Ví bị trừ tiền ngay khi đặt hàng; phần còn chờ chỉ là bàn giao sản phẩm.
  return order.paymentStatus === "paid" || isWalletPaymentMethod(order.paymentMethod);
}

function toPublicPaymentMethod(value: unknown) {
  const normalized = normalizePaymentMethod(value);
  if (normalized) {
    return normalized;
  }

  const fallback = String(value || "")
    .trim()
    .toLowerCase();

  return fallback || "unknown";
}
function pickSequential<T>(items: T[], count: number, seed: number) {
  if (!Array.isArray(items) || items.length === 0 || count <= 0) {
    return [];
  }

  const result: T[] = [];
  const start = Math.abs(seed) % items.length;

  for (let i = 0; i < count; i += 1) {
    result.push(items[(start + i) % items.length]);
  }

  return result;
}

function buildDeliveryAccessForProduct(params: {
  orderId: number;
  itemIndex: number;
  qty: number;
  productType: "physical" | "digital" | "ai_account" | "source_code" | "service";
  secureDelivery: SellerSecureDelivery;
}) {
  const { orderId, itemIndex, qty, productType, secureDelivery } = params;

  if (productType === "ai_account") {
    const requested = Math.max(1, Math.min(20, Math.round(Number(qty || 1))));
    const selected = pickSequential(
      secureDelivery.accountCredentials,
      requested,
      orderId + itemIndex
    ).map((item) => ({
      accountType: item.accountType,
      username: item.username,
      password: item.password,
      note: item.note || "",
    }));

    if (selected.length === 0) {
      return undefined;
    }

    return {
      method: "ai_account" as const,
      accounts: selected,
    };
  }

  if (productType === "source_code") {
    const downloads = secureDelivery.sourceDownloads.slice(0, 30).map((item) => ({
      label: item.label,
      url: item.url,
      note: item.note || "",
      passwordHint: item.passwordHint || "",
    }));

    if (downloads.length === 0) {
      return undefined;
    }

    return {
      method: "source_code" as const,
      downloads,
    };
  }

  return undefined;
}

async function hydrateOrderProducts(order: typeof orders.$inferSelect) {
  const products = parseOrderProducts(order.productsJson);
  if (products.length === 0) {
    return [];
  }

  const sellerProductIds = Array.from(
    new Set(
      products
        .map((item) => Number(item.sellerProductId || item.product || 0))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );

  const sellerRows =
    sellerProductIds.length > 0
      ? await db
          .select()
          .from(sellerProducts)
          .where(inArray(sellerProducts.id, sellerProductIds))
      : [];
  const sellerMap = new Map(sellerRows.map((item) => [item.id, item]));
  const subcategoryIds = Array.from(
    new Set(
      sellerRows
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
  const includeDeliveryAccess = isOrderPaymentSettled(order);

  // Fetch order_items for this order to get fulfillment data
  const orderItemRows = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  const orderItemMapByKey = new Map(
    orderItemRows.map((item) => [
      makeOrderItemLookupKey(item.sellerProductId, item.variantLabel),
      item,
    ])
  );
  const orderItemMapBySellerProductId = new Map<number, Array<(typeof orderItems.$inferSelect)>>();
  for (const item of orderItemRows) {
    const prev = orderItemMapBySellerProductId.get(item.sellerProductId) || [];
    prev.push(item);
    orderItemMapBySellerProductId.set(item.sellerProductId, prev);
  }

  // Fetch all seller fulfillments for this order's items
  const allOrderItemIds = orderItemRows.map((item) => item.id);
  const fulfillmentRows =
    allOrderItemIds.length > 0
      ? await db
          .select()
          .from(sellerFulfillments)
          .where(inArray(sellerFulfillments.orderItemId, allOrderItemIds))
      : [];
  const fulfillmentsByOrderItemId = new Map<number, (typeof fulfillmentRows)>();
  for (const f of fulfillmentRows) {
    const prev = fulfillmentsByOrderItemId.get(f.orderItemId) || [];
    prev.push(f);
    fulfillmentsByOrderItemId.set(f.orderItemId, prev);
  }

  return products.map((item, itemIndex) => {
    const sellerProductId = Number(item.sellerProductId || item.product || 0);
    const sellerRow = Number.isFinite(sellerProductId)
      ? sellerMap.get(sellerProductId)
      : undefined;
    const listingMode = sellerRow
      ? subcategoryModeMap.get(sellerRow.subcategoryId)
      : "";
    const productType = inferFulfillmentProductType({
      requestedType: item.productType,
      deliveryMethod: sellerRow?.deliveryMethod,
      listingMode,
      itemPayload: item,
    });
    const orderItem =
      orderItemMapByKey.get(makeOrderItemLookupKey(sellerProductId, item.option)) ||
      orderItemMapBySellerProductId.get(sellerProductId)?.[0];

    const mapped: Record<string, unknown> = {
      ...item,
      sellerProductId: Number.isFinite(sellerProductId) && sellerProductId > 0
        ? sellerProductId
        : item.sellerProductId,
      productType,
    };

    // Add fulfillment status from order_items
    if (orderItem) {
      mapped.fulfillmentStatus = orderItem.fulfillmentStatus;
      mapped.autoRefundAt = orderItem.autoRefundAt;
      mapped.fulfilledQty = Number(orderItem.qty || 1);
    }

    if (!includeDeliveryAccess) {
      delete mapped.deliveryAccess;
      return mapped;
    }

    // New flow: get delivery data from seller_fulfillments (supports multiple fulfillments)
    if (orderItem) {
      const itemFulfillments = fulfillmentsByOrderItemId.get(orderItem.id) || [];
      if (itemFulfillments.length > 0) {
        const allAccounts: Array<{ accountType: string; username: string; password: string; note: string }> = [];
        const allDownloads: Array<{ label: string; url: string; note: string; passwordHint: string }> = [];
        let latestFulfilledAt: string | null = null;

        for (const f of itemFulfillments) {
          const data = decryptSellerSecureDelivery(f.fulfilledDataJson);
          if (data.accountCredentials.length > 0) {
            allAccounts.push(...data.accountCredentials.map((acc) => ({
              accountType: acc.accountType,
              username: acc.username,
              password: acc.password,
              note: acc.note || "",
            })));
          }
          if (data.sourceDownloads.length > 0) {
            allDownloads.push(...data.sourceDownloads.map((dl) => ({
              label: dl.label,
              url: dl.url,
              note: dl.note || "",
              passwordHint: dl.passwordHint || "",
            })));
          }
          if (f.createdAt && (!latestFulfilledAt || f.createdAt > latestFulfilledAt)) {
            latestFulfilledAt = f.createdAt;
          }
        }

        if (productType === "ai_account" && allAccounts.length > 0) {
          mapped.deliveryAccess = {
            method: "ai_account" as const,
            accounts: allAccounts,
          };
        } else if (productType === "source_code" && allDownloads.length > 0) {
          mapped.deliveryAccess = {
            method: "source_code" as const,
            downloads: allDownloads,
          };
        }
        if (latestFulfilledAt) {
          mapped.fulfilledAt = latestFulfilledAt;
        }
      } else if (orderItem.fulfillmentStatus === "fulfilled" && orderItem.fulfilledDataJson) {
        // Fallback: single fulfillment from orderItem (legacy)
        const fulfilledData = decryptSellerSecureDelivery(orderItem.fulfilledDataJson);
        if (productType === "ai_account" && fulfilledData.accountCredentials.length > 0) {
          mapped.deliveryAccess = {
            method: "ai_account" as const,
            accounts: fulfilledData.accountCredentials.map((acc) => ({
              accountType: acc.accountType,
              username: acc.username,
              password: acc.password,
              note: acc.note || "",
            })),
          };
        } else if (productType === "source_code" && fulfilledData.sourceDownloads.length > 0) {
          mapped.deliveryAccess = {
            method: "source_code" as const,
            downloads: fulfilledData.sourceDownloads.map((dl) => ({
              label: dl.label,
              url: dl.url,
              note: dl.note || "",
              passwordHint: dl.passwordHint || "",
            })),
          };
        }
      }
    } else if (!orderItem && sellerRow) {
      // Legacy fallback: old orders without order_items - use pre-stored data
      const secureDelivery = extractSecureDelivery(sellerRow.assetsJson);
      const quantity = Math.max(1, Number(item.qty || 1));
      const deliveryAccess = buildDeliveryAccessForProduct({
        orderId: order.id,
        itemIndex,
        qty: quantity,
        productType,
        secureDelivery,
      });

      if (deliveryAccess) {
        mapped.deliveryAccess = deliveryAccess;
      }
    }

    if (!mapped.deliveryAccess) {
      delete mapped.deliveryAccess;
    }

    return mapped;
  });
}

async function mapOrder(order: typeof orders.$inferSelect) {
  const shippingAddress = JSON.parse(order.shippingAddressJson || "{}");
  const shippingStatus = mapShippingStatus(order.shippingStatus);
  const deliveryInfo = normalizeDeliveryInfo(order);
  const products = await hydrateOrderProducts(order);

  let userName = "";
  let userEmail = "";
  try {
    const userRows = await db.select().from(users).where(eq(users.id, order.userId));
    if (userRows[0]) {
      userName = String(userRows[0].name || "");
      userEmail = String(userRows[0].email || "");
    }
  } catch { /* ignore */ }

  return {
    _id: String(order.id),
    user: {
      _id: String(order.userId),
      name: userName,
      email: userEmail,
    },
    products,
    paymentMethod: toPublicPaymentMethod(order.paymentMethod),
    total: order.total,
    shippingPrice: order.shippingPrice,
    taxPrice: 0,
    isPaid: isOrderPaymentSettled(order),
    status: shippingStatus,
    totalBeforeDiscount: order.totalBeforeDiscount,
    couponApplied: order.couponApplied,
    shippingStatus,
    shippingAddress,
    deliveryInfo,
    paymentResult: order.payosPaymentLinkId || "",
    shippingTimes: order.shippingTimes,
    shipping: shippingAddress,
    createdAt: order.createdAt,
  };
}

async function validateOrderProducts(
  products: CreateOrderProductInput[],
  sellerProductMap: Map<number, typeof sellerProducts.$inferSelect>
) {
  if (!Array.isArray(products) || products.length === 0) {
    return "Đơn hàng phải có ít nhất 1 sản phẩm";
  }

  for (const product of products) {
    if (!Number.isFinite(Number(product.qty)) || Number(product.qty) <= 0) {
      return `Số lượng sản phẩm không hợp lệ: ${product.name || "(không rõ tên)"}`;
    }

    const sellerProduct = sellerProductMap.get(Number(product.sellerProductId));

    if (!sellerProduct) {
      return `Sản phẩm không tồn tại: ${product.name || "(không rõ tên)"}`;
    }

    const variants = JSON.parse(sellerProduct.variantsJson || "[]") as Array<{
      id: string;
      label: string;
      price: number;
      stock: number;
    }>;

    const selected = variants.find((v) => v.id === product.selectedVariantId);
    if (!selected) {
      return `Biến thể không hợp lệ cho sản phẩm: ${product.name || "(không rõ tên)"}`;
    }

    if (Number(product.qty) > Number(selected.stock)) {
      return `Số lượng vượt tồn kho cho biến thể: ${selected.label}`;
    }

    if (Number(product.price) !== Number(selected.price)) {
      return `Giá biến thể không hợp lệ: ${selected.label}`;
    }
  }

  return null;
}

async function loadSellerProductMap(products: CreateOrderProductInput[]) {
  const sellerProductIds = Array.from(
    new Set(
      products
        .map((product) => Number(product.sellerProductId))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );

  if (sellerProductIds.length === 0) {
    return new Map<number, typeof sellerProducts.$inferSelect>();
  }

  const rows = await db
    .select()
    .from(sellerProducts)
    .where(inArray(sellerProducts.id, sellerProductIds));

  return new Map(rows.map((item) => [item.id, item]));
}

async function loadSubcategoryListingModeMap(
  sellerProductMap: Map<number, typeof sellerProducts.$inferSelect>
) {
  const subcategoryIds = Array.from(
    new Set(
      Array.from(sellerProductMap.values())
        .map((item) => Number(item.subcategoryId))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );

  if (subcategoryIds.length === 0) {
    return new Map<number, string>();
  }

  const rows = await db
    .select({
      id: productSubcategories.id,
      listingMode: productSubcategories.listingMode,
    })
    .from(productSubcategories)
    .where(inArray(productSubcategories.id, subcategoryIds));

  return new Map(rows.map((item) => [item.id, item.listingMode]));
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    const sessionUserId = Number(sessionUser.id);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();
    const user = searchParams.get("user")?.trim();

    if (id) {
      const idNum = Number(id);
      if (!Number.isFinite(idNum)) {
        return badRequest("id không hợp lệ");
      }

      const rows = await db.select().from(orders).where(eq(orders.id, idNum));
      const order = rows[0];

      if (!order) {
        return ok({ data: null });
      }

      if (order.userId !== sessionUserId) {
        return unauthorized("Bạn không có quyền truy cập đơn hàng này");
      }

      return ok({ data: await mapOrder(order) });
    }

    if (user) {
      const userId = Number(user);
      if (!Number.isFinite(userId)) {
        return badRequest("user không hợp lệ");
      }

      if (userId !== sessionUserId) {
        return unauthorized("Bạn không có quyền truy cập danh sách đơn hàng này");
      }

      const rows = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));

      const mappedRows = await Promise.all(rows.map((item) => mapOrder(item)));
      return ok({ data: mappedRows });
    }

    return badRequest("Thiếu id hoặc user");
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/order",
      message: "Không thể lấy đơn hàng",
      error,
    });

    return serverError("Không thể lấy đơn hàng", { requestId });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    const body = await request.json();
    const parsed = orderCreateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dữ liệu đặt hàng không hợp lệ", zodDetails(parsed.error));
    }

    const {
      user: userId,
      products,
      shippingAddress,
      deliveryInfo,
      paymentMethod: rawPaymentMethod,
      idempotencyKey,
      total,
      totalBeforeDiscount,
      couponApplied,
      shippingStatus,
      shippingTimes,
      shippingPrice,
    } = parsed.data;

    const sellerProductMap = await loadSellerProductMap(products);
    const subcategoryListingModeMap = await loadSubcategoryListingModeMap(
      sellerProductMap
    );
    const productsValidationError = await validateOrderProducts(
      products,
      sellerProductMap
    );
    if (productsValidationError) {
      return badRequest(productsValidationError, { requestId });
    }

    const sessionUserId = Number(sessionUser.id);

    if (userId !== sessionUserId) {
      return unauthorized("Không thể tạo đơn hàng cho người dùng khác");
    }

    const paymentMethod = normalizePaymentMethod(rawPaymentMethod);
    if (!paymentMethod) {
      return badRequest("Phương thức thanh toán không hợp lệ", { requestId });
    }

    const normalizedDeliveryInfo = String(
      deliveryInfo || shippingAddress?.deliveryInfo || shippingAddress?.address || ""
    ).trim();
    if (!normalizedDeliveryInfo) {
      return badRequest("Vui lòng nhập thông tin bàn giao sản phẩm số", { requestId });
    }

    const duplicateRows = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.idempotencyKey, idempotencyKey)
        )
      );

    const duplicated = duplicateRows[0];
    if (duplicated) {
      return ok({
        message: "Đơn hàng đã được tạo trước đó",
        order_id: String(duplicated.id),
        checkoutUrl: duplicated.payosCheckoutUrl || null,
      });
    }

    const nowIso = new Date().toISOString();

    const transactionResult = await db.transaction(async (tx) => {
      // Pre-check wallet balance for wallet payment
      if (paymentMethod === "wallet") {
        const walletRows = await tx.select().from(wallets).where(eq(wallets.userId, userId));
        const wallet = walletRows[0];

        if (!wallet || wallet.balance < total) {
          throw new Error("Số dư ví không đủ để thanh toán");
        }
      }

      const normalizedShippingAddress = {
        firstName: shippingAddress?.firstName || "",
        lastName: shippingAddress?.lastName || "",
        phoneNumber: shippingAddress?.phoneNumber || "",
        state: shippingAddress?.state || "",
        city: shippingAddress?.city || "",
        zipCode: shippingAddress?.zipCode || "",
        address: shippingAddress?.address || normalizedDeliveryInfo,
        country: shippingAddress?.country || "",
        deliveryInfo: normalizedDeliveryInfo,
      };

      // Ví đã trừ tiền ngay khi đặt hàng; trạng thái chờ chỉ áp dụng cho bàn giao.
      const insertedRows = await tx
        .insert(orders)
        .values({
          userId,
          productsJson: JSON.stringify(products),
          shippingAddressJson: JSON.stringify(normalizedShippingAddress),
          idempotencyKey,
          paymentMethod,
          total,
          totalBeforeDiscount,
          couponApplied: couponApplied || null,
          shippingStatus: "pending_handover",
          shippingTimes,
          shippingPrice,
          paymentStatus: paymentMethod === "wallet" ? "paid" : "pending",
          createdAt: nowIso,
        })
        .returning();

      const inserted = insertedRows[0];

      let payosCheckoutUrl: string | null = null;

      // Ví: trừ số dư ngay, tiền vào escrow, sau đó chờ người bán bàn giao.
      if (paymentMethod === "wallet") {
        const walletRows = await tx.select().from(wallets).where(eq(wallets.userId, userId));
        const currentWallet = walletRows[0];
        if (!currentWallet) {
          throw new Error("Số dư ví không đủ để thanh toán");
        }
        await tx
          .update(wallets)
          .set({
            balance: Number((currentWallet.balance - total).toFixed(2)),
            updatedAt: nowIso,
          })
          .where(eq(wallets.id, currentWallet.id));

        await tx.insert(walletTransactions).values({
          userId,
          type: "purchase_pending_hold",
          amount: total,
          status: "success",
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        await tx.insert(escrowTransactions).values({
          buyerId: userId,
          orderId: inserted.id,
          amount: total,
          status: "held",
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      if (paymentMethod === "payos") {
        const orderCode = Number(String(Date.now()).slice(-9)) * 1000 + Math.floor(Math.random() * 1000);
        const returnUrl =
          process.env.PAYOS_RETURN_URL ||
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/order/${inserted.id}`;
        const cancelUrl = process.env.PAYOS_CANCEL_URL || returnUrl;

        const payosRes = await createPayOSPaymentLink({
          orderCode,
          amount: Math.max(0, Math.round(total)),
          description: `ORDER-${inserted.id}`,
          returnUrl,
          cancelUrl,
          items: [
            {
              name: "Đơn hàng",
              quantity: 1,
              price: Math.max(0, Math.round(total)),
            },
          ],
        });

        if (!payosRes.checkoutUrl || !payosRes.paymentLinkId) {
          throw new Error(`PAYOS:${String(payosRes.error || "Không thể tạo link thanh toán")}`);
        }

        payosCheckoutUrl = payosRes.checkoutUrl;

        await tx
          .update(orders)
          .set({
            payosOrderCode: String(orderCode),
            payosPaymentLinkId: payosRes.paymentLinkId,
            payosCheckoutUrl: payosCheckoutUrl,
          })
          .where(eq(orders.id, inserted.id));
      }

      const cartRows = await tx.select().from(carts).where(eq(carts.userId, userId));
      if (cartRows.length > 0) {
        await tx
          .update(carts)
          .set({ cartTotal: 0, productsJson: "[]", updatedAt: nowIso })
          .where(eq(carts.userId, userId));
      }

      // Chuẩn bị thông báo Telegram cho tất cả sản phẩm trong đơn
      const autoRefundAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const orderItemsToNotify: Array<{
        sellerId: number;
        orderItemId?: number;
        productName: string;
        variantLabel: string;
        qty: number;
        price: number;
        productType: string;
        autoRefundAt?: string | null;
      }> = [];

      for (const product of products) {
        const spId = Number(product.sellerProductId);
        if (!Number.isFinite(spId) || spId <= 0) continue;

        const sp = sellerProductMap.get(spId);
        if (!sp) continue;

        const pType = inferFulfillmentProductType({
          requestedType: product.productType,
          deliveryMethod: sp.deliveryMethod,
          listingMode: subcategoryListingModeMap.get(sp.subcategoryId),
          itemPayload: product as unknown as Record<string, unknown>,
        });
        const needsFulfillment = requiresManualFulfillment(pType);
        const notificationPayload = {
          sellerId: sp.sellerId,
          productName: String(product.name || sp.name || ""),
          variantLabel: String(product.option || ""),
          qty: Math.max(1, Number(product.qty || 1)),
          price: Number(product.price || 0),
          productType: pType,
          autoRefundAt: needsFulfillment ? autoRefundAt : null,
        };

        if (needsFulfillment) {
          const insertedItem = await tx
            .insert(orderItems)
            .values({
              orderId: inserted.id,
              sellerId: sp.sellerId,
              buyerId: userId,
              sellerProductId: spId,
              productName: String(product.name || sp.name || ""),
              variantLabel: String(product.option || ""),
              qty: Math.max(1, Number(product.qty || 1)),
              price: Number(product.price || 0),
              productType: pType,
              fulfillmentStatus: "pending",
              fulfilledDataJson: "{}",
              autoRefundAt,
              createdAt: nowIso,
              updatedAt: nowIso,
            })
            .returning();

          if (insertedItem[0]) {
            orderItemsToNotify.push({
              ...notificationPayload,
              orderItemId: insertedItem[0].id,
            });
          }

          continue;
        }

        orderItemsToNotify.push(notificationPayload);
      }

      return {
        orderId: inserted.id,
        checkoutUrl: payosCheckoutUrl,
        orderItemsToNotify,
      };
    });

    // Gửi Telegram và chờ hoàn tất để tránh rớt tác vụ trên môi trường serverless
    const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

    // Get buyer email for notification
    let buyerEmail = "";
    try {
      const buyerRows = await db.select().from(users).where(eq(users.id, Number(sessionUser.id)));
      buyerEmail = buyerRows[0]?.email || "";
    } catch { /* ignore */ }

    await Promise.all(
      transactionResult.orderItemsToNotify.map(async (item) => {
        try {
          const result = await sendSellerOrderNotification(item.sellerId, {
            orderItemId: item.orderItemId,
            orderId: transactionResult.orderId,
            productName: item.productName,
            variantLabel: item.variantLabel,
            qty: item.qty,
            price: item.price,
            productType: item.productType,
            buyerEmail,
            autoRefundAt: item.autoRefundAt,
            siteUrl,
          });

          if (!result.ok) {
            const detail =
              "detail" in result && typeof result.detail === "string"
                ? result.detail
                : "";
            console.error(
              `[order] Telegram notification failed for seller ${item.sellerId}:`,
              result.reason || "unknown",
              detail
            );
          }
        } catch (err) {
          console.error(
            `[order] Telegram notification threw for seller ${item.sellerId}:`,
            err
          );
        }
      })
    );

    return ok({
      message: "Đặt hàng thành công",
      order_id: String(transactionResult.orderId),
      checkoutUrl: transactionResult.checkoutUrl,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/order",
      message: "Không thể tạo đơn hàng",
      error,
    });

    const errorMessage = String(error);

    if (errorMessage.includes("Số dư ví không đủ")) {
      return badRequest("Số dư ví không đủ để thanh toán", { requestId });
    }

    if (errorMessage.startsWith("PAYOS:")) {
      const payosError = errorMessage.replace(/^PAYOS:/, "").trim();
      return badRequest(payosError || "Không thể tạo link thanh toán", { requestId });
    }
    return serverError("Không thể tạo đơn hàng", { requestId });
  }
}
