export const runtime = 'edge';

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";

export async function POST(request: Request) {
  try {
    await ensureDatabaseReady();

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();

    if (!name || !email || !password) {
      return badRequest("Vui lòng nhập đầy đủ thông tin");
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return badRequest("Email đã tồn tại");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    await db.insert(users).values({
      name,
      email,
      password: passwordHash,
      role: "user",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    return ok({ message: "Đăng ký thành công" });
  } catch (error) {
    return serverError("Không thể đăng ký tài khoản", String(error));
  }
}
