import { eq } from "drizzle-orm";
import { requireSessionUser } from "@/lib/api-auth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { sellerProducts } from "@/lib/schema";

type StoredReviewUser = {
  _id: string;
  name: string;
  email: string;
  image: string;
};

type StoredReview = {
  _id: string;
  reviewBy: StoredReviewUser;
  rating: number;
  review: string;
  likes: string[];
  images: string[];
  createdAt: string;
  updatedAt?: string;
};

function parseReviews(rawReviewsJson: string): StoredReview[] {
  try {
    const parsed = JSON.parse(rawReviewsJson || "[]");
    const asArray = Array.isArray(parsed) ? parsed : [];
    const reviews: StoredReview[] = [];

    asArray.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        return;
      }

      const reviewByRaw = (item as { reviewBy?: unknown }).reviewBy;
      const reviewBySource = reviewByRaw && typeof reviewByRaw === "object" ? reviewByRaw : {};

      const ratingValue = Number((item as { rating?: unknown }).rating);
      const reviewText = String((item as { review?: unknown }).review || "").trim();
      const createdAtRaw = String((item as { createdAt?: unknown }).createdAt || "").trim();

      if (!Number.isFinite(ratingValue) || !reviewText || !createdAtRaw) {
        return;
      }

      const likes = Array.isArray((item as { likes?: unknown[] }).likes)
        ? (item as { likes: unknown[] }).likes.map((value) => String(value))
        : [];

      const images = Array.isArray((item as { images?: unknown[] }).images)
        ? (item as { images: unknown[] }).images.map((value) => String(value))
        : [];

      reviews.push({
        _id: String((item as { _id?: unknown })._id || `${Date.now()}-${index}`),
        reviewBy: {
          _id: String((reviewBySource as { _id?: unknown })._id || "").trim(),
          name: String((reviewBySource as { name?: unknown }).name || "").trim(),
          email: String((reviewBySource as { email?: unknown }).email || "").trim(),
          image: String((reviewBySource as { image?: unknown }).image || "").trim(),
        },
        rating: Math.max(0, Math.min(5, ratingValue)),
        review: reviewText,
        likes,
        images,
        createdAt: createdAtRaw,
        updatedAt: String((item as { updatedAt?: unknown }).updatedAt || "").trim() || undefined,
      });
    });

    return reviews;
  } catch {
    return [];
  }
}

function normalizeRating(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0 || numericValue > 5) {
    return null;
  }

  return Math.round(numericValue * 2) / 2;
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseReady();

    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized("Bạn cần đăng nhập để gửi đánh giá");
    }

    const body = await request.json();
    const productId = Number(body?.productId);
    const reviewText = String(body?.review || "").trim();
    const rating = normalizeRating(body?.rating);

    if (!Number.isFinite(productId) || productId <= 0) {
      return badRequest("Sản phẩm không hợp lệ");
    }

    if (reviewText.length < 2 || reviewText.length > 255) {
      return badRequest("Nội dung đánh giá phải từ 2 đến 255 ký tự");
    }

    if (!rating) {
      return badRequest("Số sao đánh giá không hợp lệ");
    }

    const productRows = await db
      .select()
      .from(sellerProducts)
      .where(eq(sellerProducts.id, productId));
    const product = productRows[0];

    if (!product) {
      return badRequest("Sản phẩm không tồn tại");
    }

    const existingReviews = parseReviews(product.reviewsJson || "[]");
    const nowIso = new Date().toISOString();
    const userId = String(sessionUser.id);
    const bodyReviewBy =
      body?.reviewBy && typeof body.reviewBy === "object" ? body.reviewBy : {};
    const userName = String(
      (bodyReviewBy as { name?: unknown }).name || "Người dùng"
    ).trim();
    const userEmail = String(
      (bodyReviewBy as { email?: unknown }).email || sessionUser.email || ""
    ).trim();
    const userImage = String((bodyReviewBy as { image?: unknown }).image || "").trim();
    const reviewPayload: StoredReview = {
      _id: `${productId}-${userId}-${Date.now()}`,
      reviewBy: {
        _id: userId,
        name: userName,
        email: userEmail,
        image: userImage,
      },
      rating,
      review: reviewText,
      likes: [],
      images: [],
      createdAt: nowIso,
    };

    const existingIndex = existingReviews.findIndex(
      (item) => String(item?.reviewBy?._id || "") === userId
    );

    let message = "Đã gửi đánh giá thành công";
    if (existingIndex >= 0) {
      const current = existingReviews[existingIndex];
      existingReviews[existingIndex] = {
        ...current,
        ...reviewPayload,
        _id: current._id || reviewPayload._id,
        likes: current.likes || [],
        images: current.images || [],
        createdAt: current.createdAt || nowIso,
        updatedAt: nowIso,
      };
      message = "Đã cập nhật đánh giá thành công";
    } else {
      existingReviews.push(reviewPayload);
    }

    await db
      .update(sellerProducts)
      .set({
        reviewsJson: JSON.stringify(existingReviews),
        updatedAt: nowIso,
      })
      .where(eq(sellerProducts.id, productId));

    return ok({
      message,
      data: existingIndex >= 0 ? existingReviews[existingIndex] : reviewPayload,
    });
  } catch (error) {
    return serverError("Không thể gửi đánh giá", {
      error: String(error),
    });
  }
}
