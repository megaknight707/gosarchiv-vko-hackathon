// Журнал действий сотрудников (ТЗ §6.8): вход и выход, создание, изменение (с перечнем
// изменённых полей), удаление, смена статуса и прав, загрузка и удаление файлов.
// Запись в журнал не должна ломать основное действие — ошибки только логируются.
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { requestIp } from "@/lib/auth/require-role";

export type AuditAction =
  | "login"
  | "login_failed"
  | "login_locked"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "file_upload"
  | "file_delete"
  | "file_reorder"
  | "import"
  | "user_create"
  | "user_update"
  | "password_reset"
  | "feedback_update"
  | "ai_recommendations";

export const AUDIT_ACTIONS: AuditAction[] = [
  "login",
  "login_failed",
  "login_locked",
  "logout",
  "create",
  "update",
  "delete",
  "status_change",
  "file_upload",
  "file_delete",
  "file_reorder",
  "import",
  "user_create",
  "user_update",
  "password_reset",
  "feedback_update",
  "ai_recommendations",
];

export async function writeAuditLog(entry: {
  userId: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details as Prisma.InputJsonValue | undefined,
        ip: await requestIp(),
      },
    });
  } catch (error) {
    console.error("[audit] не удалось записать в журнал:", error);
  }
}

function shorten(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.length > 160) return `${value.slice(0, 160)}…`;
  return value;
}

/** Какие поля изменились: { titleRu: ["было", "стало"] } (длинные тексты сокращаются) */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  const changes: Record<string, [unknown, unknown]> = {};
  for (const [key, next] of Object.entries(after)) {
    const prev = before[key];
    const same =
      prev instanceof Date || next instanceof Date
        ? String(prev && new Date(prev as Date).getTime()) === String(next && new Date(next as Date).getTime())
        : JSON.stringify(prev ?? null) === JSON.stringify(next ?? null);
    if (!same) changes[key] = [shorten(prev ?? null), shorten(next ?? null)];
  }
  return changes;
}
