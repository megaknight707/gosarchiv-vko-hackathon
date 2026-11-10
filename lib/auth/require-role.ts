// Проверка прав на сервере. Вызывается в каждом layout/странице админки и в каждом Server Action.
// Скрытая кнопка — это удобство, а не защита: даже прямая ссылка или запрос
// без прав получат отказ здесь.
import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { can, type AdminAction, type AdminResource } from "./permissions";
import { getCurrentUser, type AdminUser } from "./session";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "./session-token";

/** Для страниц: нет входа → на страницу входа; нет прав → «Нет доступа» */
export async function requireAdminPage(locale: Locale, resource?: AdminResource, action: AdminAction = "view"): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/admin/login`);
  if (resource && !can(user, resource, action)) redirect(`/${locale}/admin/forbidden`);
  return user;
}

export class AdminAccessError extends Error {
  constructor(message = "FORBIDDEN") {
    super(message);
  }
}

/**
 * Для Server Actions: проверяет сессию и право, продлевает сессию (действие = активность).
 * Бросает AdminAccessError — действие отвечает «нет прав» и ничего не меняет.
 */
export async function requireAdminAction(resource?: AdminResource, action: AdminAction = "view"): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) throw new AdminAccessError("UNAUTHORIZED");
  if (resource && !can(user, resource, action)) throw new AdminAccessError();
  (await cookies()).set(SESSION_COOKIE, await signSessionToken(user.id, user.role), sessionCookieOptions);
  return user;
}

/** IP для журнала действий сотрудников (для посетителей сайта IP не сохраняется) */
export async function requestIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}
