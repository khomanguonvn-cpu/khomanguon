export const runtime = 'edge';

import { ok, serverError } from "@/lib/api-response";
import { getRequestId } from "@/lib/observability";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const { db } = await import("@/lib/db");

    // Gracefully handle missing slides table
    try {
      const { slides } = await import("@/lib/schema");
      const { eq } = await import("drizzle-orm");

      const { searchParams } = new URL(request.url);
      const slug = searchParams.get("slug");

      const rows = await db
        .select()
        .from(slides)
        .where(slug ? eq(slides.slug, slug) : undefined);

      return ok({ data: rows, requestId });
    } catch {
      // Table doesn't exist yet — return empty array
      return ok({ data: [], requestId });
    }
  } catch (error) {
    return serverError("Không thể tải slides", { requestId, error: String(error) });
  }
}