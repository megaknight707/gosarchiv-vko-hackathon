// Ограничение частоты запросов (форма отзывов, геокодинг, позже — ИИ-помощник).
// Ключ — хэш IP-адреса с солью (сам IP нигде не хранится) + назначение.
// Окно фиксированное: например, не больше 5 отзывов за 10 минут с одного адреса.
import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

/** Обезличенный идентификатор клиента: sha256(соль + IP) */
export async function clientFingerprint(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const salt = process.env.AUTH_SECRET ?? "gosarchiv-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Учитывает попытку и говорит, разрешена ли она.
 * @returns true — можно, false — лимит исчерпан
 */
export async function checkRateLimit(purpose: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `${purpose}:${await clientFingerprint()}`;
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const record = await db.rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  // Изредка чистим старые окна (старше суток), чтобы таблица не росла
  if (Math.random() < 0.02) {
    await db.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 86_400_000) } } }).catch(() => {});
  }

  return record.count <= limit;
}
