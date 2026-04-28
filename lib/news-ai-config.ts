import { inArray } from "drizzle-orm";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { systemIntegrations } from "@/lib/schema";

export type NewsAiProvider = "openrouter" | "groq" | "mistral";

export type NewsAiConfig = {
  provider: NewsAiProvider;
  model: string;
  groqApiKey: string;
  openrouterApiKey: string;
  mistralApiKey: string;
};

const SETTINGS_KEYS = [
  "news_ai_provider",
  "news_ai_model",
  "news_ai_groq_key",
  "news_ai_openrouter_key",
  "news_ai_mistral_key",
] as const;

const CACHE_TTL_MS = 10_000;

let cache: {
  expiresAt: number;
  data: NewsAiConfig;
} | null = null;

function normalize(input: unknown) {
  return String(input ?? "").trim();
}

function normalizeProvider(input: unknown): NewsAiProvider {
  const value = normalize(input).toLowerCase();
  if (value === "groq") {
    return "groq";
  }
  if (value === "mistral") {
    return "mistral";
  }
  return "openrouter";
}

function defaultModelByProvider(provider: NewsAiProvider) {
  return provider === "groq"
    ? "llama-3.3-70b-versatile"
    : "openai/gpt-4o-mini";
}

export function invalidateNewsAiConfigCache() {
  cache = null;
}

export async function getNewsAiConfig(options?: { forceRefresh?: boolean }) {
  const useCache =
    !options?.forceRefresh && cache && cache.expiresAt > Date.now();
  if (useCache && cache) {
    return cache.data;
  }

  await ensureDatabaseReady();

  const rows = await db
    .select({
      key: systemIntegrations.key,
      value: systemIntegrations.value,
    })
    .from(systemIntegrations)
    .where(inArray(systemIntegrations.key, [...SETTINGS_KEYS]));

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = normalize(row.value);
  }

  const provider = normalizeProvider(
    map.news_ai_provider || process.env.NEWS_AI_PROVIDER || "openrouter"
  );
  const model =
    normalize(map.news_ai_model || process.env.NEWS_AI_MODEL) ||
    defaultModelByProvider(provider);

  const data: NewsAiConfig = {
    provider,
    model,
    groqApiKey: normalize(map.news_ai_groq_key || process.env.GROQ_API_KEY),
    openrouterApiKey: normalize(
      map.news_ai_openrouter_key || process.env.OPENROUTER_API_KEY
    ),
    mistralApiKey: normalize(
      map.news_ai_mistral_key || process.env.MISTRAL_API_KEY
    ),
  };

  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  };

  return data;
}

