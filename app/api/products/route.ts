
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCategories, productSubcategories, sellerProducts } from "@/lib/schema";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { ok, serverError } from "@/lib/api-response";

type SellerVariant = {
  id: string;
  label: string;
  price: number;
  stock: number;
  attributes?: Array<{ key: string; value: string | number | boolean }>;
};

type PublicAsset = {
  type: "image";
  url: string;
  label?: string;
};

type LegacyReviewUser = {
  _id?: string;
  name?: string;
  email?: string;
  image?: string;
};

type LegacyReview = {
  _id?: string;
  reviewBy?: LegacyReviewUser;
  rating: number;
  review: string;
  likes: string[];
  images?: string[];
  createdAt: string;
  updatedAt?: string;
};

function parsePublicAssets(rawAssetsJson: string) {
  try {
    const parsed = JSON.parse(rawAssetsJson || "[]");
    const asArray = Array.isArray(parsed) ? parsed : [];
    const assets = asArray.filter(
      (item): item is PublicAsset =>
        !!item &&
        typeof item === "object" &&
        item.type === "image" &&
        typeof item.url === "string"
    );

    const unique = new Set<string>();
    const urls: string[] = [];
    for (const asset of assets) {
      const url = String(asset.url || "").trim();
      if (!url || unique.has(url)) {
        continue;
      }
      unique.add(url);
      urls.push(url);
      if (urls.length >= 20) {
        break;
      }
    }

    return urls;
  } catch {
    return [];
  }
}

function parseReviews(rawReviewsJson: string): LegacyReview[] {
  try {
    const parsed = JSON.parse(rawReviewsJson || "[]");
    const asArray = Array.isArray(parsed) ? parsed : [];
    const reviews: LegacyReview[] = [];

    asArray.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        return;
      }

      const ratingValue = Number((item as { rating?: unknown }).rating);
      const reviewText = String((item as { review?: unknown }).review || "").trim();
      const createdAtRaw = String((item as { createdAt?: unknown }).createdAt || "").trim();

      if (!Number.isFinite(ratingValue) || !reviewText || !createdAtRaw) {
        return;
      }

      const likes = Array.isArray((item as { likes?: unknown[] }).likes)
        ? (item as { likes: unknown[] }).likes.map((like) => String(like))
        : [];

      const imageList = Array.isArray((item as { images?: unknown[] }).images)
        ? (item as { images: unknown[] }).images.map((image) => String(image))
        : [];

      const reviewByRaw = (item as { reviewBy?: unknown }).reviewBy;
      const reviewBy =
        reviewByRaw && typeof reviewByRaw === "object"
          ? {
              _id: String((reviewByRaw as { _id?: unknown })._id || "").trim(),
              name: String((reviewByRaw as { name?: unknown }).name || "").trim(),
              email: String((reviewByRaw as { email?: unknown }).email || "").trim(),
              image: String((reviewByRaw as { image?: unknown }).image || "").trim(),
            }
          : undefined;

      reviews.push({
        _id: String((item as { _id?: unknown })._id || `${Date.now()}-${index}`),
        reviewBy,
        rating: Math.max(0, Math.min(5, ratingValue)),
        review: reviewText,
        likes,
        images: imageList,
        createdAt: createdAtRaw,
        updatedAt: String((item as { updatedAt?: unknown }).updatedAt || "").trim() || undefined,
      });
    });

    return reviews;
  } catch {
    return [];
  }
}

function toProductType(deliveryMethod: string, listingMode?: string) {
  const value = String(deliveryMethod || "").trim().toLowerCase();
  if (value === "ai_account") return "ai_account";
  if (value === "source_code") return "source_code";
  if (value === "service") return "service";
  if (value === "physical") return "physical";

  const mode = String(listingMode || "").trim().toLowerCase();
  if (mode === "digital_account") return "ai_account";
  if (mode === "digital_license") return "source_code";
  if (mode === "service_package") return "service";

  return "digital";
}

function toLegacyProduct(
  product: typeof sellerProducts.$inferSelect,
  category: typeof productCategories.$inferSelect | undefined,
  subcategory: typeof productSubcategories.$inferSelect | undefined
) {
  const variants = JSON.parse(product.variantsJson || "[]") as SellerVariant[];
  const images = parsePublicAssets(product.assetsJson);
  const fallbackImage = `/assets/images/placeholders/${subcategory?.slug || category?.slug || "placeholder"}.png`;
  const productImages = images.length > 0 ? images : [fallbackImage];
  const productType = toProductType(product.deliveryMethod, subcategory?.listingMode);
  const reviews = parseReviews(product.reviewsJson || "[]");

  const options = variants.map((variant) => ({
    qty: Number(variant.stock || 0),
    price: Number(variant.price || 0),
    sold: 0,
    option: variant.label,
    images: productImages,
    discount: 0,
    variantId: variant.id,
    attributes: variant.attributes || [],
  }));

  return {
    _id: String(product.id),
    sellerProductId: product.id,
    name: product.name,
    featured: true,
    slug: product.slug,
    description: product.description,
    productType,
    deliveryMethod: product.deliveryMethod,
    category: {
      _id: String(category?.id || ""),
      name: category?.name || "Danh mục",
      link: `/categories/${category?.slug || "khac"}/products`,
      slug: category?.slug || "khac",
      image: productImages[0],
    },
    subCategories: [
      {
        _id: String(subcategory?.id || ""),
        name: subcategory?.name || "Khác",
        link: `/categories/${subcategory?.slug || "khac"}/products`,
        slug: subcategory?.slug || "khac",
      },
    ],
    brand: {
      _id: "system",
      name: "KHOMANGUON",
      link: "/",
      slug: "khomanguon",
      image: "/assets/images/logo.svg",
    },
    content: product.description,
    details: [],
    questions: [],
    reviews,
    subProducts: [
      {
        sku: `SP-${product.id}`,
        style: {
          name: subcategory?.name || "Mặc định",
          color: "#111827",
          image: productImages[0],
        },
        options,
      },
    ],
  };
}

export async function GET(request: Request) {
  try {
    await ensureDatabaseReady();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim();
    const categorySlug = searchParams.get("category")?.trim();
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || Number.MAX_SAFE_INTEGER);

    const products = slug
      ? await db.select().from(sellerProducts).where(eq(sellerProducts.slug, slug))
      : await db
          .select()
          .from(sellerProducts)
          .where(eq(sellerProducts.status, "active"))
          .orderBy(asc(sellerProducts.createdAt));

    const categories = await db.select().from(productCategories);
    const subcategories = await db.select().from(productSubcategories);

    const mapped = products
      .map((item) =>
        toLegacyProduct(
          item,
          categories.find((category) => category.id === item.categoryId),
          subcategories.find((subcategory) => subcategory.id === item.subcategoryId)
        )
      )
      .filter((item) => {
        if (slug) {
          return true;
        }

        const matchesCategory = categorySlug
          ? item.category.slug === categorySlug || item.subCategories.some((sub) => sub.slug === categorySlug)
          : true;

        const prices = item.subProducts.flatMap((sub) =>
          sub.options.map((option) => Number(option.price || 0))
        );
        const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const matchesPrice = lowestPrice >= minPrice && lowestPrice <= maxPrice;
        return matchesCategory && matchesPrice;
      });

    if (slug) {
      return ok({ data: mapped[0] || null });
    }

    return ok({ data: mapped });
  } catch (error) {
    return serverError("Không thể lấy danh sách sản phẩm", {
      error: String(error),
    });
  }
}
