
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { systemIntegrations } from "@/lib/schema";
import { ok, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";
import { getSeoSettings, invalidateSeoConfigCache } from "@/lib/seo-config";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return forbidden("Chỉ dành cho Quản trị viên");
    }

    await ensureDatabaseReady();
    const data = await getSeoSettings({ forceRefresh: true });

    return ok({
      data,
    });
  } catch (error) {
    logApiError({
      requestId: reqId,
      route: "GET /api/admin/seo",
      message: "Thất bại",
      error,
    });
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return forbidden("Chỉ dành cho Quản trị viên");
    }

    await ensureDatabaseReady();
    const body = await request.json();
    const now = new Date().toISOString();
    const adminId = Number(sessionUser.id);
    const updatedBy = Number.isFinite(adminId) ? adminId : null;

    const mappings: Array<[string, unknown]> = [
      ["seo_site_title", body.siteTitle],
      ["seo_meta_description", body.metaDescription],
      ["seo_keywords", body.keywords],
      ["seo_og_image", body.ogImage],
      ["seo_favicon", body.favicon],
      ["seo_twitter_handle", body.twitterHandle],
      ["seo_facebook_url", body.facebookUrl],
      ["seo_analytics_google_id", body.analyticsGoogleId],
      ["seo_analytics_gtm_id", body.analyticsGtmId],
      ["seo_schema_org_name", body.schemaOrganizationName],
      ["seo_schema_org_url", body.schemaOrganizationUrl],
      ["seo_schema_org_logo", body.schemaOrganizationLogo],
      ["seo_schema_website_name", body.schemaWebsiteName],
      ["seo_schema_custom_json", body.schemaCustomJson],
    ];

    for (const [key, value] of mappings) {
      if (value === undefined || value === null) {
        continue;
      }

      await db
        .insert(systemIntegrations)
        .values({
          key,
          value: String(value),
          updatedBy,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: systemIntegrations.key,
          set: {
            value: String(value),
            updatedBy,
            updatedAt: now,
          },
        });
    }

    invalidateSeoConfigCache();

    return ok({ success: true });
  } catch (error) {
    logApiError({
      requestId: reqId,
      route: "PUT /api/admin/seo",
      message: "Thất bại",
      error,
    });
    return serverError();
  }
}
