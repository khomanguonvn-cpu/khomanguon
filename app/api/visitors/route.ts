
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteVisitors } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDatabaseReady } from "@/lib/bootstrap";

// ── Country code → Flag emoji helper ──
function countryFlag(code: string): string {
  const cc = code.toUpperCase();
  if (cc.length !== 2 || cc === "XX") return "🌍";
  const chars = Array.from(cc);
  const codePoints = chars.map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(codePoints[0], codePoints[1]);
}

// ── GET: Return visitor stats (no auth required) ──
export async function GET() {
  try {
    await ensureDatabaseReady();

    // Total unique IPs
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(siteVisitors);
    const totalVisitors = totalResult[0]?.count ?? 0;

    // Group by country
    const countryStats = await db
      .select({
        countryCode: siteVisitors.countryCode,
        countryName: siteVisitors.countryName,
        count: sql<number>`count(*)`,
      })
      .from(siteVisitors)
      .groupBy(siteVisitors.countryCode, siteVisitors.countryName)
      .orderBy(sql`count(*) DESC`)
      .limit(20);

    const countries = countryStats.map(row => ({
      code: row.countryCode,
      name: row.countryName,
      flag: countryFlag(row.countryCode),
      count: row.count,
    }));

    return NextResponse.json({
      success: true,
      totalVisitors,
      countries,
    });
  } catch (error) {
    console.error("[visitors] Lỗi lấy thống kê:", error);
    return NextResponse.json(
      { success: false, totalVisitors: 0, countries: [] },
      { status: 500 }
    );
  }
}

// ── POST: Record a visitor (called once per session from client) ──
export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseReady();

    // Extract IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = (forwarded?.split(",")[0]?.trim()) || realIp || "127.0.0.1";

    // Check if IP already exists
    const existing = await db
      .select({ id: siteVisitors.id })
      .from(siteVisitors)
      .where(eq(siteVisitors.ip, ip))
      .limit(1);

    const now = new Date().toISOString();

    if (existing.length > 0) {
      // Update last visit time
      await db
        .update(siteVisitors)
        .set({ lastVisitAt: now })
        .where(eq(siteVisitors.ip, ip));

      return NextResponse.json({ success: true, new: false });
    }

    // Lookup country from free GeoIP API
    let countryCode = "XX";
    let countryName = "Không xác định";

    try {
      // Use ip-api.com (free, no key needed, 45 req/min)
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,country`, {
        signal: AbortSignal.timeout(3000),
      });
      if (geoRes.ok) {
        const geo = await geoRes.json() as { status: string; countryCode?: string; country?: string };
        if (geo.status === "success" && geo.countryCode) {
          countryCode = geo.countryCode;
          countryName = geo.country || countryCode;
        }
      }
    } catch {
      // GeoIP lookup failed — use default "XX"
    }

    // Insert new visitor
    await db.insert(siteVisitors).values({
      ip,
      countryCode,
      countryName,
      lastVisitAt: now,
      createdAt: now,
    });

    return NextResponse.json({ success: true, new: true });
  } catch (error) {
    console.error("[visitors] Lỗi ghi nhận truy cập:", error);
    return NextResponse.json({ success: true, new: false });
  }
}
