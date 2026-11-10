// Текущий сотрудник админки: читаем cookie, проверяем подпись токена и берём свежие данные из базы.
// Роль и блокировка проверяются по базе при каждом запросе — если главный администратор
// заблокировал сотрудника или сменил роль, это действует сразу, без ожидания конца сессии.
import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/client";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken, verifySessionToken } from "./session-token";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
};

export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, branchId: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, branchId: user.branchId };
});

export async function startSession(userId: string, role: string) {
  (await cookies()).set(SESSION_COOKIE, await signSessionToken(userId, role), sessionCookieOptions);
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
