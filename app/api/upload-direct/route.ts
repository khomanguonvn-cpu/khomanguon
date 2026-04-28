export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api-auth";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api-response";
import { isR2Configured } from "@/lib/r2";
import { getRequestId, logApiError } from "@/lib/observability";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser?.id) {
      return unauthorized("Bạn cần đăng nhập để upload ảnh", { requestId });
    }

    if (!isR2Configured()) {
      return badRequest("Hệ thống upload ảnh chưa được cấu hình", { requestId });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return badRequest("Dữ liệu form không hợp lệ", { requestId });
    }

    const file = formData.get("file") as File | null;
    const folder = String(formData.get("folder") || "kyc");

    if (!file) {
      return badRequest("Thiếu file", { requestId });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return badRequest("File vượt quá 10MB", { requestId });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return badRequest(
        `Chỉ chấp nhận: ${ALLOWED_TYPES.join(", ")}`,
        { requestId }
      );
    }

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");

    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

    const { S3Client } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    const timestamp = Date.now();
    const sanitized = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 128);
    const objectKey = `${folder}/${timestamp}-${sanitized}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL.replace(/\/$/, "")}/${objectKey}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev/${objectKey}`;

    return ok({
      publicUrl,
      objectKey,
      message: "Upload thành công",
      requestId,
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "POST /api/upload-direct",
      message: "Upload ảnh thất bại",
      error,
    });
    return serverError("Không thể upload ảnh", { requestId });
  }
}
