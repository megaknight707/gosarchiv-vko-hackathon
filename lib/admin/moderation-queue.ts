// Очередь согласования и уведомления внутри админки (без почты).
//  • модератор видит материалы «На проверке»;
//  • тот, кто может публиковать, — «Одобрено, ждёт публикации»;
//  • автор — свои разделы со статусом «Требует доработки».
import "server-only";
import type { Locale } from "@/i18n/routing";
import { branchScope, can, type PermissionSubject } from "@/lib/auth/permissions";
import type { PublicationStatus } from "@/lib/generated/prisma/client";
import { MODERATED_CONFIGS } from "./entity-configs";
import { delegateFor, recordTitle } from "./entity-service";

export type QueueKind = "review" | "publish" | "changes";

const QUEUE: { kind: QueueKind; status: PublicationStatus; action: "moderate" | "publish" | "submit" }[] = [
  { kind: "review", status: "IN_REVIEW", action: "moderate" },
  { kind: "publish", status: "APPROVED", action: "publish" },
  { kind: "changes", status: "NEEDS_CHANGES", action: "submit" },
];

/** Сколько задач ждёт пользователя (счётчик на пункте меню «Модерация») */
export async function countMyTasks(user: PermissionSubject): Promise<number> {
  const counts = await Promise.all(
    MODERATED_CONFIGS.flatMap((config) =>
      QUEUE.filter((item) => can(user, config.key, item.action)).map((item) =>
        delegateFor(config).count({ where: { status: item.status, ...(branchScope(user, config.key) ?? {}) } }),
      ),
    ),
  );
  return counts.reduce((sum, n) => sum + n, 0);
}

export type QueueEntry = { kind: QueueKind; entity: string; id: string; title: string; updatedAt: Date };

export async function loadQueue(user: PermissionSubject, locale: Locale): Promise<QueueEntry[]> {
  const entries: QueueEntry[] = [];
  for (const config of MODERATED_CONFIGS) {
    for (const item of QUEUE) {
      if (!can(user, config.key, item.action)) continue;
      const rows = await delegateFor(config).findMany({
        where: { status: item.status, ...(branchScope(user, config.key) ?? {}) },
        orderBy: { updatedAt: "asc" },
        take: 50,
      });
      for (const row of rows) {
        entries.push({ kind: item.kind, entity: config.key, id: row.id, title: recordTitle(config, row, locale), updatedAt: row.updatedAt as Date });
      }
    }
  }
  return entries;
}

export function canSeeModeration(user: PermissionSubject) {
  return MODERATED_CONFIGS.some((config) => QUEUE.some((item) => can(user, config.key, item.action)));
}
