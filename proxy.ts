// Proxy (в Next.js до 16-й версии назывался middleware) выполняется до каждой страницы:
//  • «/» и адреса без языка перенаправляет на нужный язык (/ru, /kz, /en);
//  • запоминает выбранный язык в cookie NEXT_LOCALE;
//  • в админке продлевает сессию сотрудника: любое действие сдвигает автовыход
//    на 30 минут вперёд. Права здесь НЕ проверяются — это делает сервер на каждой
//    странице и в каждом Server Action (lib/auth/require-role.ts).
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import {
  REFRESH_AFTER_SECONDS,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
} from "./lib/auth/session-token";

const intlMiddleware = createMiddleware(routing);
const ADMIN_PATH = /^\/(kz|ru|en)\/admin(\/|$)/;

export default async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  if (ADMIN_PATH.test(request.nextUrl.pathname)) {
    // Страницы админки не кэшируются браузером и прокси-серверами
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");

    // Только для переходов по страницам (GET). Server Actions (POST) продлевают сессию сами —
    // так продление не спорит с выходом из системы, который удаляет cookie.
    const session = request.method === "GET" ? await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value) : null;
    if (session && Date.now() / 1000 - session.iat > REFRESH_AFTER_SECONDS) {
      response.cookies.set(SESSION_COOKIE, await signSessionToken(session.sub, session.role), sessionCookieOptions);
    }
  }

  return response;
}

export const config = {
  // Все адреса, кроме API, служебных файлов Next.js/Vercel и файлов с точкой (favicon.ico, сканы)
  matcher: "/((?!api|_next|_vercel|uploads|.*\\..*).*)",
};
