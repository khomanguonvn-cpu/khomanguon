import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

function generateObjectKey(folder: string, originalName: string): string {
  const timestamp = Date.now();
  const sanitized = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 128);
  return `${folder}/${timestamp}-${sanitized}`;
}

export type UploadPresignResult = {
  success: boolean;
  objectKey?: string;
  publicUrl?: string;
  presignedUrl?: string;
  error?: string;
};

export async function createUploadPresignedUrl(
  folder: string,
  fileName: string,
  mimeType: string,
  expiresInSeconds: number = 300
): Promise<UploadPresignResult> {
  if (!isR2Configured()) {
    return { success: false, error: "Cloudflare R2 chưa được cấu hình" };
  }

  try {
    const objectKey = generateObjectKey(folder, fileName);
    const client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: mimeType,
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL.replace(/\/$/, "")}/${objectKey}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev/${objectKey}`;

    return { success: true, objectKey, publicUrl, presignedUrl };
  } catch (error) {
    console.error("[R2] Create presigned URL failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tạo presigned URL thất bại",
    };
  }
}

export async function deleteR2Object(objectKey: string): Promise<boolean> {
  if (!isR2Configured()) {
    return false;
  }

  try {
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
      })
    );
    return true;
  } catch (error) {
    console.error("[R2] Delete object failed:", error);
    return false;
  }
}

export async function deleteR2Objects(objectKeys: string[]): Promise<void> {
  const validKeys = objectKeys.filter(Boolean);
  if (validKeys.length === 0) return;
  for (const key of validKeys) {
    await deleteR2Object(key);
  }
}

export function extractObjectKeyFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  const r2DevPattern = `.r2.dev/`;
  const r2CfPattern = `.r2.cloudflarestorage.com/`;
  const customPattern = R2_PUBLIC_URL.replace(/\/$/, "") + "/";

  let objectKey: string | null = null;

  if (trimmed.includes(r2DevPattern)) {
    objectKey = trimmed.split(r2DevPattern)[1];
  } else if (trimmed.includes(r2CfPattern)) {
    objectKey = trimmed.split(r2CfPattern)[1];
  } else if (R2_PUBLIC_URL && trimmed.includes(customPattern)) {
    objectKey = trimmed.split(customPattern)[1];
  }

  if (!objectKey) return null;

  const queryIndex = objectKey.indexOf("?");
  return queryIndex !== -1 ? objectKey.slice(0, queryIndex) : objectKey;
}
