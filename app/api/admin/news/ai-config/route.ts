export const runtime = 'edge';

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { systemIntegrations } from "@/lib/schema";
import { badRequest, forbidden, ok, serverError } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import {
  getNewsAiConfig,
  invalidateNewsAiConfigCache,
  type NewsAiProvider,
} from "@/lib/news-ai-config";

function normalize(input: unknown) {
  return String(input ?? "").trim();
}

function normalizeProvider(input: unknown): NewsAiProvider {
  const value = normalize(input).toLowerCase();
  return value === "groq" ? "groq" : value === "mistral" ? "mistral" : "openrouter";
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền truy cập");
    }

    const data = await getNewsAiConfig({ forceRefresh: true });
    return ok({ data, requestId });
  } catch (error) {
    logApiError({
      requestId,
      route: "GET /api/admin/news/ai-config",
      message: "Không thể tải cấu hình AI",
      error,
    });
    return serverError("Không thể tải cấu hình AI", { requestId });
  }
}

export async function PUT(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    await ensureDatabaseReady();

    const adminUser = await requireAdminUser();
    if (!adminUser) {
      return forbidden("Chỉ quản trị viên mới có quyền cấu hình AI");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const provider = normalizeProvider(body.provider);
    const model = normalize(body.model);
    const groqApiKey = normalize(body.groqApiKey);
    const openrouterApiKey = normalize(body.openrouterApiKey);
    const mistralApiKey = normalize(body.mistralApiKey);

    if (!model) {
      return badRequest("Thiếu model AI", { requestId });
    }

    const now = new Date().toISOString();
    const adminId = Number(adminUser.id);
    const updatedBy = Number.isFinite(adminId) ? adminId : null;

    const mappings: Array<[string, string, boolean]> = [
      ["news_ai_provider", provider, false],
      ["news_ai_model", model, false],
      ["news_ai_groq_key", groqApiKey, true],
      ["news_ai_openrouter_key", openrouterApiKey, true],
      ["news_ai_mistral_key", mistralApiKey, true],
    ];

    for (const [key, value, isEncrypted] of mappings) {
      await db
        .insert(systemIntegrations)
        .values({
          key,
          value,
          isEncrypted,
          updatedBy,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: systemIntegrations.key,
          set: {
            value,
            isEncrypted,
            updatedBy,
            updatedAt: now,
          },
        });
    }

    invalidateNewsAiConfigCache();
    const data = await getNewsAiConfig({ forceRefresh: true });

    return ok({
      success: true,
      data,
      requestId,
    });
  } catch (error) {
    logApiError({
      requestId,
      route: "PUT /api/admin/news/ai-config",
      message: "Không thể lưu cấu hình AI",
      error,
    });
    return serverError("Không thể lưu cấu hình AI", { requestId });
  }
}
