import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { systemIntegrations } from "@/lib/schema";

export type PayOSConfig = {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  apiEndpoint: string;
  source: PayOSConfigSource;
};

type ConfigSource = "db" | "env" | "default";

export type PayOSConfigSource = {
  clientId: ConfigSource;
  apiKey: ConfigSource;
  checksumKey: ConfigSource;
  apiEndpoint: ConfigSource;
};

const PAYOS_SETTING_KEYS = [
  "payos_client_id",
  "payos_api_key",
  "payos_checksum_key",
  "payos_api_endpoint",
] as const;

const DEFAULT_API_ENDPOINT = "https://api-merchant.payos.vn/v2/payment-requests";
const CACHE_TTL_MS = 10_000;

let cache: {
  expiresAt: number;
  data: PayOSConfig;
} | null = null;

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function resolveConfigValue(
  dbValue: unknown,
  envValue: unknown,
  defaultValue = ""
): { value: string; source: ConfigSource } {
  const fromDb = normalize(dbValue);
  if (fromDb) {
    return { value: fromDb, source: "db" };
  }

  const fromEnv = normalize(envValue);
  if (fromEnv) {
    return { value: fromEnv, source: "env" };
  }

  return { value: normalize(defaultValue), source: "default" };
}

async function loadDbSettings() {
  const rows = await db
    .select({
      key: systemIntegrations.key,
      value: systemIntegrations.value,
    })
    .from(systemIntegrations)
    .where(inArray(systemIntegrations.key, [...PAYOS_SETTING_KEYS]));

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return settings;
}

export function invalidatePayOSConfigCache() {
  cache = null;
}

export async function getPayOSConfig(options?: { forceRefresh?: boolean }) {
  const shouldUseCache =
    !options?.forceRefresh && cache && cache.expiresAt > Date.now();

  if (shouldUseCache && cache) {
    return cache.data;
  }

  let dbSettings: Record<string, string> = {};
  try {
    dbSettings = await loadDbSettings();
  } catch {
    dbSettings = {};
  }

  const clientId = resolveConfigValue(
    dbSettings.payos_client_id,
    process.env.PAYOS_CLIENT_ID
  );
  const apiKey = resolveConfigValue(
    dbSettings.payos_api_key,
    process.env.PAYOS_API_KEY
  );
  const checksumKey = resolveConfigValue(
    dbSettings.payos_checksum_key,
    process.env.PAYOS_CHECKSUM_KEY
  );
  const apiEndpoint = resolveConfigValue(
    dbSettings.payos_api_endpoint,
    process.env.PAYOS_API_ENDPOINT,
    DEFAULT_API_ENDPOINT
  );

  const data: PayOSConfig = {
    clientId: clientId.value,
    apiKey: apiKey.value,
    checksumKey: checksumKey.value,
    apiEndpoint: apiEndpoint.value || DEFAULT_API_ENDPOINT,
    source: {
      clientId: clientId.source,
      apiKey: apiKey.source,
      checksumKey: checksumKey.source,
      apiEndpoint: apiEndpoint.source,
    },
  };

  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  };

  return data;
}

