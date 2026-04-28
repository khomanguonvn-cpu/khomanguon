import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { systemIntegrations } from "@/lib/schema";

export type OAuthConfig = {
  googleClientId: string;
  googleClientSecret: string;
  facebookClientId: string;
  facebookClientSecret: string;
  source: OAuthConfigSource;
};

type ConfigSource = "db" | "env" | "default";

export type OAuthConfigSource = {
  googleClientId: ConfigSource;
  googleClientSecret: ConfigSource;
  facebookClientId: ConfigSource;
  facebookClientSecret: ConfigSource;
};

const OAUTH_SETTING_KEYS = [
  "google_oauth_client_id",
  "google_oauth_client_secret",
  "facebook_oauth_client_id",
  "facebook_oauth_client_secret",
] as const;

const CACHE_TTL_MS = 60_000; // 1 min cache

let cache: {
  expiresAt: number;
  data: OAuthConfig;
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
    .where(inArray(systemIntegrations.key, [...OAUTH_SETTING_KEYS]));

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return settings;
}

export function invalidateOAuthConfigCache() {
  cache = null;
}

export async function getOAuthConfig(options?: { forceRefresh?: boolean }) {
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

  const googleClientId = resolveConfigValue(
    dbSettings.google_oauth_client_id,
    process.env.GOOGLE_CLIENT_ID
  );
  const googleClientSecret = resolveConfigValue(
    dbSettings.google_oauth_client_secret,
    process.env.GOOGLE_CLIENT_SECRET
  );
  const facebookClientId = resolveConfigValue(
    dbSettings.facebook_oauth_client_id,
    process.env.FACEBOOK_CLIENT_ID
  );
  const facebookClientSecret = resolveConfigValue(
    dbSettings.facebook_oauth_client_secret,
    process.env.FACEBOOK_CLIENT_SECRET
  );

  const data: OAuthConfig = {
    googleClientId: googleClientId.value,
    googleClientSecret: googleClientSecret.value,
    facebookClientId: facebookClientId.value,
    facebookClientSecret: facebookClientSecret.value,
    source: {
      googleClientId: googleClientId.source,
      googleClientSecret: googleClientSecret.source,
      facebookClientId: facebookClientId.source,
      facebookClientSecret: facebookClientSecret.source,
    },
  };

  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  };

  return data;
}
