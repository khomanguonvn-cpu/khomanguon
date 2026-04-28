import { like } from "drizzle-orm";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { systemIntegrations } from "@/lib/schema";

export type SiteConfig = {
  // TopBar
  contactEmail: string;
  contactPhone: string;
  announcementText: string;
  announcementLink: string;
  announcementEnabled: string;

  // Footer - Social
  facebookUrl: string;
  youtubeUrl: string;
  zaloUrl: string;
  telegramUrl: string;
  tiktokUrl: string;

  // Footer - Contact
  footerEmail: string;
  footerPhone: string;
  footerAddress: string;
  footerDescription: string;

  // Footer - Copyright
  copyrightText: string;
  paymentMethods: string;
};

const DEFAULT_CONFIG: SiteConfig = {
  contactEmail: "contact@khoinguon.io.vn",
  contactPhone: "0868 686 868",
  announcementText: "",
  announcementLink: "",
  announcementEnabled: "false",

  facebookUrl: "https://facebook.com",
  youtubeUrl: "https://youtube.com",
  zaloUrl: "https://zalo.me",
  telegramUrl: "https://t.me",
  tiktokUrl: "",

  footerEmail: "contact@khoinguon.io.vn",
  footerPhone: "0868 686 868",
  footerAddress: "",
  footerDescription:
    "Nền tảng marketplace chuyên cung cấp các sản phẩm số chất lượng cao với giao hàng tự động 24/7.",

  copyrightText: "",
  paymentMethods: "Visa,Mastercard,PayPal,Chuyển khoản",
};

const CACHE_TTL_MS = 15_000;

let cache: {
  expiresAt: number;
  data: SiteConfig;
} | null = null;

function normalize(input: unknown) {
  return String(input ?? "").trim();
}

export function invalidateSiteConfigCache() {
  cache = null;
}

export async function getSiteConfig(options?: { forceRefresh?: boolean }) {
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
    .where(like(systemIntegrations.key, "site_%"));

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = normalize(row.value);
  }

  const data: SiteConfig = {
    contactEmail: map.site_contact_email || DEFAULT_CONFIG.contactEmail,
    contactPhone: map.site_contact_phone || DEFAULT_CONFIG.contactPhone,
    announcementText: map.site_announcement_text || DEFAULT_CONFIG.announcementText,
    announcementLink: map.site_announcement_link || DEFAULT_CONFIG.announcementLink,
    announcementEnabled: map.site_announcement_enabled || DEFAULT_CONFIG.announcementEnabled,

    facebookUrl: map.site_facebook_url || DEFAULT_CONFIG.facebookUrl,
    youtubeUrl: map.site_youtube_url || DEFAULT_CONFIG.youtubeUrl,
    zaloUrl: map.site_zalo_url || DEFAULT_CONFIG.zaloUrl,
    telegramUrl: map.site_telegram_url || DEFAULT_CONFIG.telegramUrl,
    tiktokUrl: map.site_tiktok_url || DEFAULT_CONFIG.tiktokUrl,

    footerEmail: map.site_footer_email || DEFAULT_CONFIG.footerEmail,
    footerPhone: map.site_footer_phone || DEFAULT_CONFIG.footerPhone,
    footerAddress: map.site_footer_address || DEFAULT_CONFIG.footerAddress,
    footerDescription: map.site_footer_description || DEFAULT_CONFIG.footerDescription,

    copyrightText: map.site_copyright_text || DEFAULT_CONFIG.copyrightText,
    paymentMethods: map.site_payment_methods || DEFAULT_CONFIG.paymentMethods,
  };

  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  };

  return data;
}
