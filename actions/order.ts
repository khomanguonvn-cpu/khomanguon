import { and, desc, eq, inArray } from "drizzle-orm";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { orderItems, orders, productSubcategories, sellerProducts, users } from "@/lib/schema";
import {
  decryptSellerSecureDelivery,
} from "@/lib/secure-delivery";

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

function toPublicPaymentMethod(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "wallet" ||
    normalized === "wallet_balance" ||
    normalized === "walletbalance"
  ) {
    return "wallet";
  }

  if (normalized === "cod" || normalized === "cashondelivery") {
    return "cash_on_delivery";
  }

  if (normalized === "credit_card" || normalized === "stripe" || normalized === "paypal") {
    return "payos";
  }

  return normalized || "unknown";
}

function isWalletPaymentMethod(value: unknown) {
  const m = String(value || "").trim().toLowerCase();
  return m === "wallet" || m === "wallet_balance" || m === "walletbalance";
}

function isOrderPaymentSettled(paymentStatus: unknown, paymentMethod: unknown) {
  return (
    String(paymentStatus || "").trim().toLowerCase() === "paid" ||
    isWalletPaymentMethod(paymentMethod)
  );
}

function normalizeProductType(value: unknown): string {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "ai_account") return "ai_account";
  if (normalized === "source_code") return "source_code";
  if (normalized === "service") return "service";
  if (normalized === "physical") return "physical";
  return normalized || "digital";
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

function inferProductType(params: {
  requestedType?: unknown;
  deliveryMethod?: unknown;
  listingMode?: unknown;
  itemPayload?: Record<string, unknown>;
}) {
  const { requestedType, deliveryMethod, listingMode, itemPayload } = params;
  const directType = normalizeProductType(requestedType || deliveryMethod);

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

function makeOrderItemLookupKey(sellerProductId: number, variantLabel: unknown) {
  return `${sellerProductId}::${String(variantLabel || "").trim().toLowerCase()}`;
}

function buildDeliveryAccess(params: {
  productType: string;
  orderItem: typeof orderItems.$inferSelect;
}) {
  const { productType, orderItem } = params;

  if (orderItem.fulfillmentStatus !== "fulfilled") {
    return undefined;
  }

  if (!orderItem.fulfilledDataJson || orderItem.fulfilledDataJson === "{}") {
    return undefined;
  }

  try {
    const fulfilledData = decryptSellerSecureDelivery(orderItem.fulfilledDataJson);

    if (productType === "ai_account" && fulfilledData.accountCredentials.length > 0) {
      return {
        method: "ai_account" as const,
        accounts: fulfilledData.accountCredentials.map((acc) => ({
          accountType: acc.accountType,
          username: acc.username,
          password: acc.password,
          note: acc.note || "",
        })),
      };
    }

    if (productType === "source_code" && fulfilledData.sourceDownloads.length > 0) {
      return {
        method: "source_code" as const,
        downloads: fulfilledData.sourceDownloads.map((dl) => ({
          label: dl.label,
          url: dl.url,
          note: dl.note || "",
          passwordHint: dl.passwordHint || "",
        })),
      };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function hydrateProducts(
  productsJson: string,
  orderId: number,
  paymentStatus: string,
  paymentMethod: string
) {
  try {
    const rawProducts = JSON.parse(productsJson || "[]");
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) return [];

    const sellerProductIds = Array.from(
      new Set(
        rawProducts
          .map((p) => Number(p.sellerProductId || p.product || 0))
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

    const orderItemRows =
      sellerProductIds.length > 0
        ? await db
            .select()
            .from(orderItems)
            .where(and(eq(orderItems.orderId, orderId)))
        : [];

    const includeDeliveryAccess = isOrderPaymentSettled(paymentStatus, paymentMethod);

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

    return rawProducts.map((item) => {
      const sellerProductId = Number(item.sellerProductId || item.product || 0);
      const sellerRow = Number.isFinite(sellerProductId)
        ? sellerMap.get(sellerProductId)
        : undefined;
      const productType = inferProductType({
        requestedType: item.productType,
        deliveryMethod: sellerRow?.deliveryMethod,
        listingMode: sellerRow ? subcategoryModeMap.get(sellerRow.subcategoryId) : "",
        itemPayload: item as Record<string, unknown>,
      });
      const orderItem =
        orderItemMapByKey.get(makeOrderItemLookupKey(sellerProductId, item.option)) ||
        orderItemMapBySellerProductId.get(sellerProductId)?.[0];

      const mapped: Record<string, unknown> = {
        ...item,
        sellerProductId: sellerProductId > 0 ? sellerProductId : item.sellerProductId,
        productType,
      };

      if (orderItem) {
        mapped.fulfillmentStatus = orderItem.fulfillmentStatus;
        mapped.autoRefundAt = orderItem.autoRefundAt;
        mapped.fulfilledAt = orderItem.fulfilledAt;
      }

      if (!includeDeliveryAccess) {
        delete mapped.deliveryAccess;
        return mapped;
      }

      if (orderItem) {
        const deliveryAccess = buildDeliveryAccess({ productType, orderItem });
        if (deliveryAccess) {
          mapped.deliveryAccess = deliveryAccess;
        }
      }

      if (!mapped.deliveryAccess) {
        delete mapped.deliveryAccess;
      }

      return mapped;
    });
  } catch {
    return [];
  }
}

export async function getOrdersByUserId(id: string | undefined): Promise<any[]> {
  try {
    if (!id) return [];

    const userId = Number(id);
    if (!Number.isFinite(userId)) return [];

    await ensureDatabaseReady();

    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const results = await Promise.all(
      rows.map(async (order) => {
        const shippingAddress = JSON.parse(order.shippingAddressJson || "{}");
        const shippingStatus = mapShippingStatus(order.shippingStatus);
        const deliveryInfo = String(
          shippingAddress?.deliveryInfo || shippingAddress?.address || ""
        ).trim();

        const products = await hydrateProducts(
          order.productsJson,
          order.id,
          order.paymentStatus,
          order.paymentMethod
        );

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
          isPaid: isOrderPaymentSettled(order.paymentStatus, order.paymentMethod),
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
      })
    );

    return results;
  } catch {
    return [];
  }
}
