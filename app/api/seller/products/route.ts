import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  productCategories,
  productSubcategories,
  sellerProducts,
  sellerProfiles,
} from "@/lib/schema";
import {
  badRequest,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { requireSessionUser } from "@/lib/api-auth";
import {
  sellerProductAssetSchema,
  sellerProductBulkDeleteSchema,
  sellerProductBulkStatusSchema,
  sellerProductCreateSchema,
  sellerProductStatusSchema,
  sellerProductUpdateSchema,
  zodDetails,
} from "@/lib/validators";
import {
  decryptSellerSecureDelivery,
  encryptSellerSecureDelivery,
  hasSecureDeliveryData,
  normalizeSellerSecureDelivery,
  type SellerSecureDelivery,
} from "@/lib/secure-delivery";

type VariantTemplateField = {
  key: string;
  required?: boolean;
  type?: "text" | "number" | "select";
  options?: Array<string | number>;
};

type SellerVariantInput = {
  id: string;
  label: string;
  price: number;
  stock: number;
  attributes: Array<{ key: string; value: string | number | boolean }>;
};

type SellerAssetInput = {
  type: "image";
  url: string;
  label?: string;
};

type StoredAssetItem =
  | SellerAssetInput
  | {
      type: "secure_delivery";
      payload: string;
    };

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isAdminUser(sessionUser: { role?: string | null }) {
  return String(sessionUser?.role || "").trim().toLowerCase() === "admin";
}

function parseVariantSchema(raw: string) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? (parsed as VariantTemplateField[]) : [];
  } catch {
    return [];
  }
}

function ensureVariantsMatchTemplate(
  template: VariantTemplateField[],
  variants: SellerVariantInput[]
) {
  for (const variant of variants) {
    for (const field of template) {
      const matched = variant.attributes.find((attribute) => attribute.key === field.key);

      if (field.required && !matched) {
        return `Biến thể "${variant.label}" thiếu thuộc tính bắt buộc: ${field.key}`;
      }

      if (!matched) {
        continue;
      }

      if (field.type === "number" && typeof matched.value !== "number") {
        return `Thuộc tính ${field.key} của biến thể "${variant.label}" phải là số`;
      }

      if (field.type === "text" && typeof matched.value !== "string") {
        return `Thuộc tính ${field.key} của biến thể "${variant.label}" phải là chuỗi`;
      }

      if (field.options?.length) {
        const found = field.options.some((option) => String(option) === String(matched.value));
        if (!found) {
          return `Thuộc tính ${field.key} của biến thể "${variant.label}" không nằm trong danh sách cho phép`;
        }
      }
    }
  }

  return null;
}

function parseStoredAssets(raw: string): StoredAssetItem[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? (parsed as StoredAssetItem[]) : [];
  } catch {
    return [];
  }
}

function normalizePublicAssets(input: unknown): SellerAssetInput[] {
  const asArray = Array.isArray(input) ? input : [];
  const unique = new Map<string, SellerAssetInput>();

  for (const item of asArray) {
    const parsed = sellerProductAssetSchema.safeParse(item);
    if (!parsed.success) {
      continue;
    }

    const value = parsed.data;
    if (!unique.has(value.url)) {
      unique.set(value.url, value);
    }
  }

  return Array.from(unique.values()).slice(0, 30);
}

function extractPublicAssets(rawAssetsJson: string) {
  const stored = parseStoredAssets(rawAssetsJson);
  return normalizePublicAssets(stored.filter((item) => item && item.type === "image"));
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
    return normalizeSellerSecureDelivery(null);
  }

  return decryptSellerSecureDelivery(secureNode.payload);
}

function buildAssetsJson(publicAssetsInput: unknown, secureDeliveryInput: unknown) {
  const publicAssets = normalizePublicAssets(publicAssetsInput);
  const secureDelivery = normalizeSellerSecureDelivery(secureDeliveryInput);

  const payload: StoredAssetItem[] = [...publicAssets];
  if (hasSecureDeliveryData(secureDelivery)) {
    const encrypted = encryptSellerSecureDelivery(secureDelivery);
    if (encrypted) {
      payload.push({
        type: "secure_delivery",
        payload: encrypted,
      });
    }
  }

  return JSON.stringify(payload);
}

function validateSecureDeliveryByMethod(
  _deliveryMethod: string,
  _secureDelivery: SellerSecureDelivery
) {
  // Sellers now fulfill orders manually via Telegram notification flow
  // No need to pre-enter credentials when creating products
  return null;
}

function mapSellerProductRow(row: typeof sellerProducts.$inferSelect) {
  return {
    ...row,
    variants: JSON.parse(row.variantsJson || "[]"),
    assets: extractPublicAssets(row.assetsJson),
    secureDelivery: extractSecureDelivery(row.assetsJson),
  };
}

export async function GET(request: Request) {
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    const sessionUserId = Number(sessionUser.id);
    const allowViewOthers = isAdminUser(sessionUser);

    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get("seller_id")?.trim();
    const search = searchParams.get("search")?.trim() || "";
    const categorySlug = searchParams.get("categorySlug")?.trim() || "";
    const subcategorySlug = searchParams.get("subcategorySlug")?.trim() || "";
    const sortBy = searchParams.get("sortBy")?.trim() || "created_desc";
    const statusFilter = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));

    let sellerId = sessionUserId;
    if (sellerIdParam && Number.isFinite(Number(sellerIdParam))) {
      const requestedSellerId = Number(sellerIdParam);
      if (requestedSellerId !== sessionUserId && !allowViewOthers) {
        return unauthorized("Bạn không có quyền xem sản phẩm của seller khác");
      }
      sellerId = requestedSellerId;
    }

    const rows = await db
      .select()
      .from(sellerProducts)
      .where(eq(sellerProducts.sellerId, sellerId))
      .orderBy(asc(sellerProducts.createdAt));

    const categories = await db.select().from(productCategories);
    const subcategories = await db.select().from(productSubcategories);

    const categoryId = categorySlug
      ? categories.find((category) => category.slug === categorySlug)?.id
      : undefined;
    const subcategoryId = subcategorySlug
      ? subcategories.find((subcategory) => subcategory.slug === subcategorySlug)?.id
      : undefined;

    let filteredRows = rows.filter((item) => {
      const nameMatched = search
        ? item.name.toLowerCase().includes(search.toLowerCase())
        : true;
      const categoryMatched = categoryId ? item.categoryId === categoryId : true;
      const subcategoryMatched = subcategoryId ? item.subcategoryId === subcategoryId : true;
      const statusMatched = statusFilter ? item.status === statusFilter : true;
      return nameMatched && categoryMatched && subcategoryMatched && statusMatched;
    });

    filteredRows = filteredRows.sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      if (sortBy === "price_asc") return Number(a.basePrice) - Number(b.basePrice);
      if (sortBy === "price_desc") return Number(b.basePrice) - Number(a.basePrice);
      if (sortBy === "created_asc") return String(a.createdAt).localeCompare(String(b.createdAt));
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });

    const total = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const pagedRows = filteredRows.slice(start, start + limit);

    return ok({
      data: pagedRows.map(mapSellerProductRow),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return serverError("Không thể lấy danh sách sản phẩm seller", {
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

    // ── Bắt buộc kích hoạt Telegram Bot trước khi cho bán hàng ──
    const sellerProfileRows = await db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, Number(sessionUser.id)));
    const sellerProfile = sellerProfileRows[0];

    if (
      !sellerProfile ||
      !sellerProfile.telegramBotToken?.trim() ||
      !sellerProfile.telegramChatId?.trim()
    ) {
      return badRequest(
        "Bạn phải kích hoạt Telegram Bot trước khi đăng bán sản phẩm. " +
        "Vào mục \"Telegram Bot\" trong menu Người bán để cấu hình."
      );
    }

    const body = await request.json();
    const parsed = sellerProductCreateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dữ liệu sản phẩm không hợp lệ", zodDetails(parsed.error));
    }

    const payload = parsed.data;

    const categoryRows = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.slug, payload.categorySlug));
    const category = categoryRows[0];

    if (!category) {
      return badRequest("Danh mục cha không tồn tại");
    }

    const subRows = await db
      .select()
      .from(productSubcategories)
      .where(
        and(
          eq(productSubcategories.slug, payload.subcategorySlug),
          eq(productSubcategories.categoryId, category.id)
        )
      );
    const sub = subRows[0];

    if (!sub) {
      return badRequest("Danh mục con không tồn tại hoặc không thuộc danh mục cha");
    }

    const template = parseVariantSchema(sub.variantSchemaJson);
    const templateError = ensureVariantsMatchTemplate(template, payload.variants);
    if (templateError) {
      return badRequest(templateError);
    }

    const secureDelivery = normalizeSellerSecureDelivery(payload.secureDelivery);
    const secureDeliveryError = validateSecureDeliveryByMethod(payload.deliveryMethod, secureDelivery);
    if (secureDeliveryError) {
      return badRequest(secureDeliveryError);
    }

    const nowIso = new Date().toISOString();
    const slugBase = normalizeSlug(payload.name);
    const slug = `${slugBase}-${Date.now()}`;

    const assetsJson = buildAssetsJson(payload.assets, secureDelivery);

    const inserted = await db
      .insert(sellerProducts)
      .values({
        sellerId: Number(sessionUser.id),
        categoryId: category.id,
        subcategoryId: sub.id,
        slug,
        name: payload.name,
        description: payload.description,
        deliveryMethod: payload.deliveryMethod,
        stock: payload.stock,
        basePrice: payload.basePrice,
        variantsJson: JSON.stringify(payload.variants),
        assetsJson,
        status: "active",
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .returning();

    return ok({
      message: "Đăng sản phẩm thành công",
      data: mapSellerProductRow(inserted[0]),
    });
  } catch (error) {
    return serverError("Không thể đăng sản phẩm", {
      error: String(error),
    });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    const body = await request.json();

    const parsedBulkStatus = sellerProductBulkStatusSchema.safeParse(body);
    if (parsedBulkStatus.success) {
      const ownRows = await db
        .select()
        .from(sellerProducts)
        .where(eq(sellerProducts.sellerId, Number(sessionUser.id)));
      const ownIds = new Set(ownRows.map((item) => item.id));
      const ids = parsedBulkStatus.data.ids.filter((id) => ownIds.has(id));

      if (ids.length === 0) {
        return badRequest("Không có sản phẩm hợp lệ để cập nhật trạng thái");
      }

      const nowIso = new Date().toISOString();
      for (const id of ids) {
        await db
          .update(sellerProducts)
          .set({
            status: parsedBulkStatus.data.status,
            updatedAt: nowIso,
          })
          .where(eq(sellerProducts.id, id));
      }

      return ok({ message: `Đã cập nhật trạng thái ${ids.length} sản phẩm` });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id")?.trim();

    if (!idParam || !Number.isFinite(Number(idParam))) {
      return badRequest("Thiếu id sản phẩm cần cập nhật");
    }

    const existingRows = await db
      .select()
      .from(sellerProducts)
      .where(eq(sellerProducts.id, Number(idParam)));
    const existing = existingRows[0];

    if (!existing) {
      return badRequest("Sản phẩm không tồn tại");
    }

    if (existing.sellerId !== Number(sessionUser.id) && !isAdminUser(sessionUser)) {
      return unauthorized("Bạn không có quyền sửa sản phẩm này");
    }

    if (body?.status && Object.keys(body).length === 1) {
      const statusParsed = sellerProductStatusSchema.safeParse(body);
      if (!statusParsed.success) {
        return badRequest("Trạng thái sản phẩm không hợp lệ", zodDetails(statusParsed.error));
      }

      await db
        .update(sellerProducts)
        .set({
          status: statusParsed.data.status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sellerProducts.id, Number(idParam)));

      return ok({ message: "Cập nhật trạng thái sản phẩm thành công" });
    }

    const parsed = sellerProductUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dữ liệu cập nhật không hợp lệ", zodDetails(parsed.error));
    }

    let categoryId = existing.categoryId;
    let subcategoryId = existing.subcategoryId;
    let variantsJson = existing.variantsJson;

    const hasCategoryChange = parsed.data.categorySlug || parsed.data.subcategorySlug;
    if (hasCategoryChange) {
      const categorySlug = parsed.data.categorySlug || "";
      const subcategorySlug = parsed.data.subcategorySlug || "";

      if (!categorySlug || !subcategorySlug) {
        return badRequest("Khi đổi danh mục cần truyền cả categorySlug và subcategorySlug");
      }

      const categoryRows = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.slug, categorySlug));
      const category = categoryRows[0];
      if (!category) {
        return badRequest("Danh mục cha không tồn tại");
      }

      const subRows = await db
        .select()
        .from(productSubcategories)
        .where(
          and(
            eq(productSubcategories.slug, subcategorySlug),
            eq(productSubcategories.categoryId, category.id)
          )
        );
      const sub = subRows[0];

      if (!sub) {
        return badRequest("Danh mục con không tồn tại hoặc không thuộc danh mục cha");
      }

      categoryId = category.id;
      subcategoryId = sub.id;

      const variants = parsed.data.variants || JSON.parse(existing.variantsJson || "[]");
      const templateError = ensureVariantsMatchTemplate(
        parseVariantSchema(sub.variantSchemaJson),
        variants
      );
      if (templateError) {
        return badRequest(templateError);
      }

      variantsJson = JSON.stringify(variants);
    } else if (parsed.data.variants) {
      const subRows = await db
        .select()
        .from(productSubcategories)
        .where(eq(productSubcategories.id, existing.subcategoryId));
      const sub = subRows[0];

      if (!sub) {
        return badRequest("Danh mục con của sản phẩm không tồn tại");
      }

      const templateError = ensureVariantsMatchTemplate(
        parseVariantSchema(sub.variantSchemaJson),
        parsed.data.variants
      );
      if (templateError) {
        return badRequest(templateError);
      }

      variantsJson = JSON.stringify(parsed.data.variants);
    }

    const existingPublicAssets = extractPublicAssets(existing.assetsJson);
    const existingSecureDelivery = extractSecureDelivery(existing.assetsJson);
    const nextDeliveryMethod = parsed.data.deliveryMethod ?? existing.deliveryMethod;
    const nextSecureDelivery = parsed.data.secureDelivery
      ? normalizeSellerSecureDelivery(parsed.data.secureDelivery)
      : existingSecureDelivery;

    const secureDeliveryError = validateSecureDeliveryByMethod(nextDeliveryMethod, nextSecureDelivery);
    if (secureDeliveryError) {
      return badRequest(secureDeliveryError);
    }

    const assetsJson = buildAssetsJson(
      parsed.data.assets !== undefined ? parsed.data.assets : existingPublicAssets,
      nextSecureDelivery
    );

    const nowIso = new Date().toISOString();

    await db
      .update(sellerProducts)
      .set({
        categoryId,
        subcategoryId,
        name: parsed.data.name ?? existing.name,
        description: parsed.data.description ?? existing.description,
        deliveryMethod: nextDeliveryMethod,
        stock: parsed.data.stock ?? existing.stock,
        basePrice: parsed.data.basePrice ?? existing.basePrice,
        variantsJson,
        assetsJson,
        updatedAt: nowIso,
      })
      .where(eq(sellerProducts.id, existing.id));

    const updatedRows = await db
      .select()
      .from(sellerProducts)
      .where(eq(sellerProducts.id, existing.id));

    return ok({
      message: "Cập nhật sản phẩm thành công",
      data: mapSellerProductRow(updatedRows[0]),
    });
  } catch (error) {
    return serverError("Không thể cập nhật sản phẩm", {
      error: String(error),
    });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized();
    }

    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const parsedBulk = sellerProductBulkDeleteSchema.safeParse(body);
    if (parsedBulk.success) {
      const allRows = await db
        .select()
        .from(sellerProducts)
        .where(eq(sellerProducts.sellerId, Number(sessionUser.id)));

      const allowedIds = new Set(allRows.map((item) => item.id));
      const ids = parsedBulk.data.ids.filter((id) => allowedIds.has(id));

      if (ids.length === 0) {
        return badRequest("Không có sản phẩm hợp lệ để xóa");
      }

      for (const id of ids) {
        await db.delete(sellerProducts).where(eq(sellerProducts.id, id));
      }

      return ok({ message: `Đã xóa ${ids.length} sản phẩm` });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id")?.trim();

    if (!idParam || !Number.isFinite(Number(idParam))) {
      return badRequest("Thiếu id sản phẩm cần xóa");
    }

    const existingRows = await db
      .select()
      .from(sellerProducts)
      .where(eq(sellerProducts.id, Number(idParam)));
    const existing = existingRows[0];

    if (!existing) {
      return badRequest("Sản phẩm không tồn tại");
    }

    if (existing.sellerId !== Number(sessionUser.id) && !isAdminUser(sessionUser)) {
      return unauthorized("Bạn không có quyền xóa sản phẩm này");
    }

    await db.delete(sellerProducts).where(eq(sellerProducts.id, existing.id));

    return ok({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    return serverError("Không thể xóa sản phẩm", {
      error: String(error),
    });
  }
}
