"use server";

// Вход и выход сотрудников. Пароли хранятся только как bcrypt-хэш.
// После 5 неудачных попыток подряд вход блокируется на 15 минут (даже с верным паролем).
// Сообщение об ошибке одинаковое для «нет такого e-mail» и «неверный пароль» —
// так нельзя перебором узнать, какие адреса зарегистрированы.
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/admin/audit-log";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { endSession, getCurrentUser, startSession } from "./session";
import { requireAdminAction } from "./require-role";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
// Хэш для сравнения, когда пользователя нет: время ответа одинаковое
let dummyHash: string | undefined;

export type LoginState = { error?: "invalid" | "locked" | "blocked" | "rateLimited"; lockedUntil?: string; email?: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
  locale: z.enum(locales),
});

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
  });
  const email = String(formData.get("email") ?? "").slice(0, 200);
  if (!parsed.success) return { error: "invalid", email };
  const { password, locale } = parsed.data;

  // Дополнительная защита от перебора с одного адреса по многим учётным записям
  if (!(await checkRateLimit("admin-login", 30, 900))) return { error: "rateLimited", email };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    dummyHash ??= await bcrypt.hash("no-such-user", 12);
    await bcrypt.compare(password, dummyHash);
    await writeAuditLog({ userId: null, action: "login_failed", details: { email: parsed.data.email } });
    return { error: "invalid", email };
  }
  if (!user.isActive) {
    await writeAuditLog({ userId: user.id, action: "login_failed", entityType: "users", entityId: user.id, details: { reason: "blocked" } });
    return { error: "blocked", email };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: "locked", lockedUntil: user.lockedUntil.toISOString(), email };
  }

  if (!(await bcrypt.compare(password, user.passwordHash))) {
    const failed = user.failedLoginCount + 1;
    if (failed >= MAX_FAILED_LOGINS) {
      const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
      await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil } });
      await writeAuditLog({ userId: user.id, action: "login_locked", entityType: "users", entityId: user.id, details: { attempts: failed } });
      return { error: "locked", lockedUntil: lockedUntil.toISOString(), email };
    }
    await db.user.update({ where: { id: user.id }, data: { failedLoginCount: failed } });
    await writeAuditLog({ userId: user.id, action: "login_failed", entityType: "users", entityId: user.id, details: { attempts: failed } });
    return { error: "invalid", email };
  }

  await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await startSession(user.id, user.role);
  await writeAuditLog({ userId: user.id, action: "login", entityType: "users", entityId: user.id });
  redirect(`/${locale}/admin`);
}

export async function logoutAction(locale: Locale, reason?: "idle") {
  const user = await getCurrentUser();
  if (user) await writeAuditLog({ userId: user.id, action: "logout", details: reason ? { reason } : undefined });
  await endSession();
  const safeLocale = locales.includes(locale) ? locale : "ru";
  redirect(`/${safeLocale}/admin/login${reason === "idle" ? "?reason=idle" : ""}`);
}

/** «Продолжить работу» в предупреждении об автовыходе: продлевает сессию */
export async function keepAliveAction(): Promise<boolean> {
  try {
    await requireAdminAction();
    return true;
  } catch {
    return false;
  }
}
