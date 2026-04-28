import { like } from "drizzle-orm";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { systemIntegrations } from "@/lib/schema";

export type SeoSettings = {
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
  favicon: string;
  twitterHandle: string;
  facebookUrl: string;
  analyticsGoogleId: string;
  analyticsGtmId: string;
  schemaOrganizationName: string;
  schemaOrganizationUrl: string;
  schemaOrganizationLogo: string;
  schemaWebsiteName: string;
  schemaCustomJson: string;
};

const DEFAULT_SETTINGS: SeoSettings = {
  siteTitle: "",
  metaDescription: "",
  keywords: "",
  ogImage: "",
  favicon: "",
  twitterHandle: "",
  facebookUrl: "",
  analyticsGoogleId: "",
  analyticsGtmId: "",
  schemaOrganizationName: "",
  schemaOrganizationUrl: "",
  schemaOrganizationLogo: "",
  schemaWebsiteName: "",
  schemaCustomJson: "",
};

const CACHE_TTL_MS = 10_000;

let cache: {
  expiresAt: number;
  data: SeoSettings;
} | null = null;

function normalize(input: unknown) {
  return String(input ?? "").trim();
}

export function parseSeoKeywords(input: string) {
  return String(input || "")
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function invalidateSeoConfigCache() {
  cache = null;
}

export async function getSeoSettings(options?: { forceRefresh?: boolean }) {
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
    .where(like(systemIntegrations.key, "seo_%"));

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = normalize(row.value);
  }

  const data: SeoSettings = {
    siteTitle: map.seo_site_title || DEFAULT_SETTINGS.siteTitle,
    metaDescription:
      map.seo_meta_description || DEFAULT_SETTINGS.metaDescription,
    keywords: map.seo_keywords || DEFAULT_SETTINGS.keywords,
    ogImage: map.seo_og_image || DEFAULT_SETTINGS.ogImage,
    favicon: map.seo_favicon || DEFAULT_SETTINGS.favicon,
    twitterHandle: map.seo_twitter_handle || DEFAULT_SETTINGS.twitterHandle,
    facebookUrl: map.seo_facebook_url || DEFAULT_SETTINGS.facebookUrl,
    analyticsGoogleId:
      map.seo_analytics_google_id || DEFAULT_SETTINGS.analyticsGoogleId,
    analyticsGtmId:
      map.seo_analytics_gtm_id || DEFAULT_SETTINGS.analyticsGtmId,
    schemaOrganizationName:
      map.seo_schema_org_name || DEFAULT_SETTINGS.schemaOrganizationName,
    schemaOrganizationUrl:
      map.seo_schema_org_url || DEFAULT_SETTINGS.schemaOrganizationUrl,
    schemaOrganizationLogo:
      map.seo_schema_org_logo || DEFAULT_SETTINGS.schemaOrganizationLogo,
    schemaWebsiteName:
      map.seo_schema_website_name || DEFAULT_SETTINGS.schemaWebsiteName,
    schemaCustomJson:
      map.seo_schema_custom_json || DEFAULT_SETTINGS.schemaCustomJson,
  };

  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  };

  return data;
}

