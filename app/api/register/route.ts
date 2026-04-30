
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { affiliateReferrals, systemConfigs, users } from "@/lib/schema";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import crypto from "crypto";

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseReady();

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    const refCode = String(body?.refCode || "").trim().toUpperCase(); // optional referral code

    if (!name || !email || !password) {
      return badRequest("Vui lòng nhập đầy đủ thông tin");
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return badRequest("Email đã tồn tại");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    // Generate unique referral code for new user
    let newUserCode = generateReferralCode();
    let attempts = 0;
    while (attempts < 5) {
      const codeCheck = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, newUserCode));
      if (codeCheck.length === 0) break;
      newUserCode = generateReferralCode();
      attempts++;
    }

    const inserted = await db.insert(users).values({
      name,
      email,
      password: passwordHash,
      role: "user",
      emailVerified: false,
      referralCode: newUserCode,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: users.id });

    const newUserId = inserted[0]?.id;

    // Process referral if ref code provided
    if (refCode && newUserId) {
      try {
        // Check affiliate is enabled
        const configRows = await db.select().from(systemConfigs).where(eq(systemConfigs.key, "affiliate_enabled"));
        const enabled = configRows[0]?.value !== "0";

        if (enabled) {
          // Find referrer by code
          const referrerRows = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, refCode));
          const referrer = referrerRows[0];

          if (referrer && referrer.id !== newUserId) {
            // Get duration config
            const durRows = await db.select().from(systemConfigs).where(eq(systemConfigs.key, "affiliate_duration_days"));
            const durationDays = parseInt(durRows[0]?.value || "365");

            const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

            try {
              await db.insert(affiliateReferrals).values({
                referrerId: referrer.id,
                refereeId: newUserId,
                referralCode: refCode,
                expiresAt,
                createdAt: now,
              });
            } catch {
              // Ignore duplicate referee (unique constraint)
            }
          }
        }
      } catch {
        // Non-blocking
      }
    }

    return ok({ message: "Đăng ký thành công" });
  } catch (error) {
    return serverError("Không thể đăng ký tài khoản", String(error));
  }
}
