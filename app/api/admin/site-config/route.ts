
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { systemIntegrations } from "@/lib/schema";
import { ok, serverError, forbidden } from "@/lib/api-response";
import { requireSessionUser } from "@/lib/api-auth";
import { getRequestId, logApiError } from "@/lib/observability";
import { getSiteConfig, invalidateSiteConfigCache } from "@/lib/site-config";

export async function GET(request: NextRequest) {
  const reqId = getRequestId(request);
  try {
    const sessionUser = await requireSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return forbidden("Chỉ dành cho Quản trị viên");
    }

    await ensureDatabaseReady();
    const data = await getSiteConfig({ forceRefresh: true });

    return ok({ data });
  } catch (error) {
    logApiError({
      requestId: reqId,
      route: "GET /api/admin/site-config",
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
      // TopBar
      ["site_contact_email", body.contactEmail],
      ["site_contact_phone", body.contactPhone],
      ["site_announcement_text", body.announcementText],
      ["site_announcement_link", body.announcementLink],
      ["site_announcement_enabled", body.announcementEnabled],

      // Footer - Social
      ["site_facebook_url", body.facebookUrl],
      ["site_youtube_url", body.youtubeUrl],
      ["site_zalo_url", body.zaloUrl],
      ["site_telegram_url", body.telegramUrl],
      ["site_tiktok_url", body.tiktokUrl],

      // Footer - Contact
      ["site_footer_email", body.footerEmail],
      ["site_footer_phone", body.footerPhone],
      ["site_footer_address", body.footerAddress],
      ["site_footer_description", body.footerDescription],

      // Footer - Copyright
      ["site_copyright_text", body.copyrightText],
      ["site_payment_methods", body.paymentMethods],
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

    invalidateSiteConfigCache();

    return ok({ success: true });
  } catch (error) {
    logApiError({
      requestId: reqId,
      route: "PUT /api/admin/site-config",
      message: "Thất bại",
      error,
    });
    return serverError();
  }
}
