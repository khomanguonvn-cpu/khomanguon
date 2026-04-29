import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerBrandLogos } from "@/lib/schema";
import { ok, serverError } from "@/lib/api-response";
import { ensurePartnerBrandLogosTable } from "@/lib/partner-brand-logos";

export async function GET() {
  try {
    await ensurePartnerBrandLogosTable();

    const data = await db
      .select()
      .from(partnerBrandLogos)
      .where(eq(partnerBrandLogos.isActive, true))
      .orderBy(asc(partnerBrandLogos.sortOrder), asc(partnerBrandLogos.id));

    return ok({ data });
  } catch (error) {
    return serverError("Không thể tải logo đối tác", { error: String(error) });
  }
}
