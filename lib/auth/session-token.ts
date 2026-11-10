// Токен сессии сотрудника: JWT, подписанный секретом AUTH_SECRET (HS256, библиотека jose).
// Хранится в httpOnly-cookie — JavaScript страницы его не видит (защита от XSS-кражи).
// Срок жизни — 30 минут с последнего действия: proxy.ts продлевает токен при каждом запросе
// к админке, поэтому без активности сессия сама заканчивается (автовыход).
// Модуль без обращения к базе — его можно подключать и в proxy.ts.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "gs_admin_session";
export const IDLE_TIMEOUT_SECONDS = 30 * 60;
/** Токен продлевается, если ему больше 30 секунд (чтобы не переподписывать на каждый запрос) */
export const REFRESH_AFTER_SECONDS = 30;

export type SessionPayload = { sub: string; role: string; iat: number; exp: number };

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET не задан или слишком короткий (нужно ≥ 16 символов)");
  }
  // Только для локальной разработки: без секрета в .env.local вход всё равно работает
  return new TextEncoder().encode("gosarchiv-local-development-secret-only");
}

export async function signSessionToken(userId: string, role: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${IDLE_TIMEOUT_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;
    return payload as SessionPayload;
  } catch {
    return null; // подпись не сошлась или срок истёк
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: IDLE_TIMEOUT_SECONDS,
};
