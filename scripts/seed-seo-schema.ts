/**
 * Seed script: Đồng bộ dữ liệu SEO/Schema từ file JSON trong public/schema/ vào database.
 *
 * Chạy: npx tsx scripts/seed-seo-schema.ts
 *
 * Sau khi chạy xong, trang admin SEO sẽ hiển thị đầy đủ thông tin.
 */

import { db } from "../lib/db";
import { systemIntegrations } from "../lib/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://khomanguon.io.vn";

// ── Đọc file JSON ──────────────────────────────────────────────────────────────

function readJson<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "public", "schema", filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

interface OrganizationSchema {
  name: string;
  alternateName: string;
  url: string;
  logo: string;
  description: string;
  slogan?: string;
  sameAs?: string[];
  contactPoint?: {
    email?: string;
    telephone?: string;
    contactType?: string;
    availableLanguage?: string[];
    areaServed?: string;
  };
  address?: {
    addressCountry?: string;
    description?: string;
  };
}

interface WebsiteSchema {
  name: string;
  alternateName: string;
  url: string;
  description: string;
  publisher?: {
    name: string;
    logo?: { url: string };
  };
  potentialAction?: {
    target: { urlTemplate: string };
    "query-input": string;
    description?: string;
  };
}

// ── Seed helper ────────────────────────────────────────────────────────────────

const now = new Date().toISOString();

async function upsert(key: string, value: string) {
  await db
    .insert(systemIntegrations)
    .values({
      key,
      value,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: systemIntegrations.key,
      set: {
        value,
        updatedAt: now,
      },
    });

  console.log(`  ✓ ${key} = ${value.substring(0, 80)}${value.length > 80 ? "..." : ""}`);
}

async function seedSeoSchema() {
  console.log("\n📋 Seed SEO + Schema Settings\n");
  console.log("─".repeat(60));

  // ── 1. General SEO settings ───────────────────────────────────────────────

  console.log("\n[1/3] General SEO...");
  await upsert("seo_site_title", "KHOMANGUON.IO.VN - Chợ sản phẩm số hàng đầu Việt Nam");
  await upsert(
    "seo_meta_description",
    "KHOMANGUON.IO.VN - Chợ sản phẩm số hàng đầu Việt Nam. Mua bán mã nguồn, tài khoản số, tool AI, dịch vụ SaaS, Game MMO và Template. Giao dịch an toàn, kiểm duyệt kỹ, giao hàng tức thì."
  );
  await upsert(
    "seo_keywords",
    "chợ sản phẩm số, mã nguồn, tài khoản số, tool AI, SaaS, game MMO, template, mua bán sản phẩm số, khomanguon"
  );
  await upsert("seo_favicon", `${BASE_URL}/assets/images/logo.svg`);
  await upsert("seo_og_image", `${BASE_URL}/assets/images/og.png`);

  // ── 2. Social ─────────────────────────────────────────────────────────────

  console.log("\n[2/3] Social Media...");
  await upsert("seo_twitter_handle", "@khomanguon");
  await upsert("seo_facebook_url", "https://www.facebook.com/khomanguon");

  // ── 3. Schema JSON-LD ────────────────────────────────────────────────────

  console.log("\n[3/3] Schema JSON-LD...");

  let org: OrganizationSchema | null = null;
  let site: WebsiteSchema | null = null;

  try {
    org = readJson<OrganizationSchema>("organization.json");
    site = readJson<WebsiteSchema>("website.json");
  } catch (err) {
    console.error("  ✗ Không đọc được file JSON schema:", err);
    process.exit(1);
  }

  // Organization
  await upsert("seo_schema_org_name", org.name);
  await upsert("seo_schema_org_url", org.url);
  await upsert("seo_schema_org_logo", org.logo);

  // Website
  await upsert("seo_schema_website_name", site.name);

  // Custom JSON: kết hợp organization + website + breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Sản phẩm",
        item: `${BASE_URL}/products`,
      },
    ],
  };

  const customSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...org,
        "@type": "Organization",
      },
      {
        ...site,
        "@type": "WebSite",
        publisher: {
          "@type": "Organization",
          name: org.name,
          logo: {
            "@type": "ImageObject",
            url: org.logo,
          },
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${BASE_URL}/products?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      breadcrumbSchema,
    ],
  };

  await upsert("seo_schema_custom_json", JSON.stringify(customSchema, null, 2));

  console.log("\n" + "─".repeat(60));
  console.log("✅ Seed hoàn tất! Truy cập /admin/seo để xem kết quả.");
  console.log("\nTiếp theo, build lại production để áp dụng: npm run build\n");
}

// ── Chạy ─────────────────────────────────────────────────────────────────────

seedSeoSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Lỗi seed:", err);
    process.exit(1);
  });
