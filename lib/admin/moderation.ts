// Согласование публикаций (ТЗ §6.7): какие переходы между статусами возможны и кому.
//   Черновик → На проверке → (Требует доработки ↺) → Одобрено → Опубликовано → Архивировано
// Чистая логика без базы — её легко проверить тестами и объяснить.
import type { PublicationStatus } from "@/lib/generated/prisma/client";
import type { AdminAction } from "@/lib/auth/permissions";

export type TransitionOp = "submit" | "approve" | "requestChanges" | "publish" | "archive" | "restore";

type Transition = {
  from: PublicationStatus[];
  to: PublicationStatus;
  permission: AdminAction;
  /** Обязателен комментарий (почему вернули на доработку) */
  commentRequired?: boolean;
};

export const TRANSITIONS: Record<TransitionOp, Transition> = {
  // Автор отправляет черновик (или исправленный материал) на проверку
  submit: { from: ["DRAFT", "NEEDS_CHANGES"], to: "IN_REVIEW", permission: "submit" },
  // Модератор одобряет
  approve: { from: ["IN_REVIEW"], to: "APPROVED", permission: "moderate" },
  // Модератор возвращает на доработку — с обязательным комментарием
  requestChanges: { from: ["IN_REVIEW", "APPROVED"], to: "NEEDS_CHANGES", permission: "moderate", commentRequired: true },
  // Редактор публикует одобренный материал
  publish: { from: ["APPROVED"], to: "PUBLISHED", permission: "publish" },
  // Снять с публикации (в архив)
  archive: { from: ["PUBLISHED", "APPROVED"], to: "ARCHIVED", permission: "publish" },
  // Вернуть из архива в черновики
  restore: { from: ["ARCHIVED"], to: "DRAFT", permission: "publish" },
};

export const TRANSITION_OPS = Object.keys(TRANSITIONS) as TransitionOp[];

export function availableTransitions(status: PublicationStatus, allowed: (action: AdminAction) => boolean): TransitionOp[] {
  return TRANSITION_OPS.filter((op) => TRANSITIONS[op].from.includes(status) && allowed(TRANSITIONS[op].permission));
}

export function isTransitionAllowed(op: TransitionOp, status: PublicationStatus, allowed: (action: AdminAction) => boolean) {
  return availableTransitions(status, allowed).includes(op);
}
