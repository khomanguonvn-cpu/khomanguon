import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramAlerts } from "@/lib/schema";

const TELEGRAM_API_BASE = "https://api.telegram.org";

type SendCriticalAlertInput = {
  level: "info" | "warning" | "critical";
  event: string;
  message: string;
  payload?: Record<string, unknown>;
};

export async function sendCriticalAlert(input: SendCriticalAlertInput) {
  const nowIso = new Date().toISOString();
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";

  const payload = {
    message: input.message,
    event: input.event,
    extra: input.payload || null,
  };

  const inserted = await db
    .insert(telegramAlerts)
    .values({
      level: input.level,
      event: input.event,
      payload: JSON.stringify(payload),
      status: "pending",
      createdAt: nowIso,
    })
    .returning();

  const logRow = inserted[0];

  if (!botToken || !chatId) {
    return { ok: false, reason: "TELEGRAM_NOT_CONFIGURED", alertId: logRow.id };
  }

  const text = [
    `[${input.level.toUpperCase()}] ${input.event}`,
    input.message,
    input.payload ? `payload: ${JSON.stringify(input.payload)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!response.ok) {
    return { ok: false, reason: `HTTP_${response.status}`, alertId: logRow.id };
  }

  await db
    .update(telegramAlerts)
    .set({ status: "sent", sentAt: nowIso })
    .where(eq(telegramAlerts.id, logRow.id));

  return { ok: true, alertId: logRow.id };
}
