import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { productCategories, productSubcategories, sellerProducts, users } from "@/lib/schema";
import { Product, Review, User } from "@/types";

type SellerVariant = {
  id: string;
  label: string;
  price: number;
  stock: number;
  attributes?: Array<{ key: string; value: string | number | boolean }>;
};

function parseReviews(rawReviewsJson: string): Review[] {
  try {
    const parsed = JSON.parse(rawReviewsJson || "[]");
    const asArray = Array.isArray(parsed) ? parsed : [];
    const reviews: Review[] = [];

    asArray.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        return;
      }

      const ratingValue = Number((item as { rating?: unknown }).rating);
      const reviewText = String((item as { review?: unknown }).review || "").trim();
      const createdAtRaw = String((item as { createdAt?: unknown }).createdAt || "").trim();
      const createdAt = new Date(createdAtRaw);

      if (
        !Number.isFinite(ratingValue) ||
        !reviewText ||
        Number.isNaN(createdAt.getTime())
      ) {
        return;
      }

      const likes = Array.isArray((item as { likes?: unknown[] }).likes)
        ? (item as { likes: unknown[] }).likes.map((like) => String(like))
        : [];

      const reviewByRaw = (item as { reviewBy?: unknown }).reviewBy;
      let reviewBy: User | undefined;
      if (reviewByRaw && typeof reviewByRaw === "object") {
        reviewBy = {
          _id: String((reviewByRaw as { _id?: unknown })._id || "").trim(),
          name: String((reviewByRaw as { name?: unknown }).name || "Người dùng").trim(),
          email: String((reviewByRaw as { email?: unknown }).email || "").trim(),
          image: String((reviewByRaw as { image?: unknown }).image || "").trim(),
          password: "",
          role: "user",
          address: [],
        };
      }

      const updatedAtRaw = String((item as { updatedAt?: unknown }).updatedAt || "").trim();
      const updatedAtDate = updatedAtRaw ? new Date(updatedAtRaw) : undefined;
      const updatedAt =
        updatedAtDate && !Number.isNaN(updatedAtDate.getTime())
          ? updatedAtDate
          : undefined;

      reviews.push({
        _id: String((item as { _id?: unknown })._id || `${Date.now()}-${index}`),
        reviewBy,
        rating: Math.max(0, Math.min(5, ratingValue)),
        review: reviewText,
        likes,
        createdAt,
        updatedAt,
      });
    });

    return reviews;
  } catch {
    return [];
  }
}

function toLegacyProduct(
  product: typeof sellerProducts.$inferSelect,
  category: typeof productCategories.$inferSelect | undefined,
  subcategory: typeof productSubcategories.$inferSelect | undefined,
  sellerName?: string
): Product {
  const variants = JSON.parse(product.variantsJson || "[]") as SellerVariant[];
  const reviews = parseReviews(product.reviewsJson || "[]");

  return {
    _id: String(product.id),
    sellerProductId: product.id,
    sellerId: product.sellerId,
    sellerName: sellerName,
    name: product.name,
    featured: true,
    slug: product.slug,
    description: product.description,
    category: {
      _id: String(category?.id || ""),
      name: category?.name || "Danh mục",
      link: `/categories/${category?.slug || "khac"}/products`,
      slug: category?.slug || "khac",
      image: `/assets/images/placeholders/${category?.slug || "placeholder"}.png`,
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
      image: `/assets/images/placeholders/${subcategory?.slug || category?.slug || "placeholder"}.png`,
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
          image: `/assets/images/placeholders/${subcategory?.slug || category?.slug || "placeholder"}.png`,
          options: variants.map((variant) => ({
            qty: Number(variant.stock || 0),
            price: Number(variant.price || 0),
            sold: 0,
            option: variant.label,
            images: [`/assets/images/placeholders/${subcategory?.slug || category?.slug || "placeholder"}.png`],
            discount: 0,
            variantId: variant.id,
            attributes: variant.attributes || [],
          })),
        },
        options: variants.map((variant) => ({
          qty: Number(variant.stock || 0),
          price: Number(variant.price || 0),
          sold: 0,
          option: variant.label,
          images: [`/assets/images/placeholders/${subcategory?.slug || category?.slug || "placeholder"}.png`],
          discount: 0,
          variantId: variant.id,
          attributes: variant.attributes || [],
        })),
      },
    ],
  };
}

export async function getAllProductSlugs(): Promise<Array<{ slug: string }>> {
  await ensureDatabaseReady();
  const rows = await db
    .select({ slug: sellerProducts.slug })
    .from(sellerProducts)
    .where(eq(sellerProducts.status, "active"));
  return rows;
}

export async function getProductBySlug(slug: string) {
  await ensureDatabaseReady();

  const rows = await db.select().from(sellerProducts).where(eq(sellerProducts.slug, slug));
  const product = rows[0];

  if (!product) {
    return null;
  }

  const categoryRows = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.id, product.categoryId));
  const subcategoryRows = await db
    .select()
    .from(productSubcategories)
    .where(eq(productSubcategories.id, product.subcategoryId));

  let sellerName: string | undefined;
  if (product.sellerId) {
    const sellerRows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, product.sellerId));
    sellerName = sellerRows[0]?.name;
  }

  return toLegacyProduct(product, categoryRows[0], subcategoryRows[0], sellerName);
}
