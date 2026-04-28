export const runtime = 'nodejs';

/**
 * API endpoint: POST /api/admin/seo/sync-schema
 * Đồng bộ dữ liệu SEO/Schema từ file JSON trong public/schema/ vào database.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemIntegrations } from "@/lib/schema";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";

const BASE_URL = "https://khomanguon.io.vn";

interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
}

interface WebsiteSchema {
  name: string;
}

async function readJson<T>(filename: string, baseUrl: string): Promise<T> {
  const res = await fetch(`${baseUrl}/schema/${filename}`);
  return res.json() as Promise<T>;
}

export async function POST(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ success: false, message: "Chỉ dành cho Quản trị viên" }, { status: 403 });
    }

    const now = new Date().toISOString();

    const upsert = async (key: string, value: string) => {
      await db
        .insert(systemIntegrations)
        .values({ key, value, createdAt: now, updatedAt: now })
        .onConflictDoUpdate({
          target: systemIntegrations.key,
          set: { value, updatedAt: now },
        });
    };

    // 1. Read JSON schema files
    const org = await readJson<OrganizationSchema>("organization.json", BASE_URL);
    const site = await readJson<WebsiteSchema>("website.json", BASE_URL);

    // 2. SEO + Schema fields
    await upsert("seo_schema_org_name", org.name);
    await upsert("seo_schema_org_url", org.url);
    await upsert("seo_schema_org_logo", org.logo);
    await upsert("seo_schema_website_name", site.name);

    // 3. Build full custom JSON-LD graph
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Sản phẩm", item: `${BASE_URL}/products` },
      ],
    };

    const customSchema = {
      "@context": "https://schema.org",
      "@graph": [
        { ...org, "@type": "Organization" },
        {
          ...site,
          "@type": "WebSite",
          url: org.url,
          description: "Chợ sản phẩm số hàng đầu Việt Nam",
          publisher: {
            "@type": "Organization",
            name: org.name,
            logo: { "@type": "ImageObject", url: org.logo },
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

    return NextResponse.json({ success: true, message: "Đã đồng bộ Schema từ JSON" });
  } catch (error) {
    logApiError({ requestId: reqId, route: "POST /api/admin/seo/sync-schema", message: "Thất bại", error });
    return NextResponse.json({ success: false, message: "Lỗi server" }, { status: 500 });
  }
}
