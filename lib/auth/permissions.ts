// Матрица прав: роль → какие действия разрешены с какими разделами админки (ТЗ §6.1).
// Один источник правды: по нему строится меню, скрываются кнопки и — главное —
// проверяется каждый запрос на сервере (lib/auth/require-role.ts).
import type { PublicationStatus, Role } from "@/lib/generated/prisma/client";

export type AdminResource =
  | "funds"
  | "inventories"
  | "units"
  | "documents"
  | "import"
  | "exhibitions"
  | "exhibits"
  | "collections"
  | "persons"
  | "events"
  | "news"
  | "pages"
  | "faq"
  | "branches"
  | "feedback"
  | "users"
  | "audit"
  | "analytics"
  | "settings";

/**
 * view — просматривать; create / edit / delete — создавать, менять, удалять;
 * submit — отправлять на проверку; moderate — одобрять или возвращать на доработку;
 * publish — публиковать на сайте и снимать с публикации.
 */
export type AdminAction = "view" | "create" | "edit" | "delete" | "submit" | "moderate" | "publish";

const ALL: AdminAction[] = ["view", "create", "edit", "delete", "submit", "moderate", "publish"];
const AUTHOR: AdminAction[] = ["view", "create", "edit", "delete", "submit"];
const REVIEWER: AdminAction[] = ["view", "moderate", "publish"];

const CATALOG: AdminResource[] = ["funds", "inventories", "units", "documents"];
const MUSEUM: AdminResource[] = ["exhibitions", "exhibits", "collections", "persons", "events"];
const CONTENT: AdminResource[] = ["news", "pages", "faq"];

type Matrix = Partial<Record<AdminResource, AdminAction[]>>;

function grant(resources: AdminResource[], actions: AdminAction[]): Matrix {
  return Object.fromEntries(resources.map((r) => [r, actions]));
}

const EVERYTHING: AdminResource[] = [
  ...CATALOG,
  "import",
  ...MUSEUM,
  ...CONTENT,
  "branches",
  "feedback",
  "users",
  "audit",
  "analytics",
  "settings",
];

export const PERMISSIONS: Record<Role, Matrix> = {
  // Главный администратор — полный доступ ко всем модулям
  SUPER_ADMIN: grant(EVERYTHING, ALL),
  // Администратор сайта — страницы, контент, филиалы, пользователи (кроме главных администраторов)
  SITE_ADMIN: {
    ...grant(CATALOG, ["view"]),
    ...grant([...MUSEUM, ...CONTENT, "branches"], ALL),
    feedback: ["view", "edit"],
    users: ["view", "create", "edit"],
    audit: ["view"],
    analytics: ["view"],
    settings: ["view"],
  },
  // Редактор — создание, редактирование и публикация информационных материалов
  EDITOR: {
    ...grant(CATALOG, ["view", "publish"]),
    ...grant([...MUSEUM, ...CONTENT], [...AUTHOR, "publish"]),
    feedback: ["view"],
  },
  // Сотрудник архива — электронный каталог
  ARCHIVIST: {
    ...grant(CATALOG, AUTHOR),
    import: ["view", "create"],
    ...grant(MUSEUM, ["view"]),
  },
  // Администратор филиала — информация своего филиала и его новости
  BRANCH_ADMIN: {
    branches: ["view", "edit"],
    news: AUTHOR,
  },
  // Модератор — проверка и согласование материалов перед публикацией
  MODERATOR: {
    ...grant([...CATALOG, ...MUSEUM, ...CONTENT], REVIEWER),
    feedback: ["view", "edit"],
  },
  // Аналитик — статистика и отчёты
  ANALYST: {
    analytics: ["view"],
    feedback: ["view"],
  },
};

export type PermissionSubject = { role: Role; branchId: string | null };

export function can(user: PermissionSubject, resource: AdminResource, action: AdminAction): boolean {
  return PERMISSIONS[user.role][resource]?.includes(action) ?? false;
}

/** Разделы, в которых записи привязаны к филиалу: администратор филиала видит только свой */
export const BRANCH_SCOPED: Partial<Record<AdminResource, "id" | "branchId">> = {
  branches: "id",
  news: "branchId",
};

/** Ограничение по филиалу для запросов к базе (или null — ограничений нет) */
export function branchScope(user: PermissionSubject, resource: AdminResource): Record<string, string> | null {
  const field = BRANCH_SCOPED[resource];
  if (user.role !== "BRANCH_ADMIN" || !field) return null;
  return { [field]: user.branchId ?? "__no_branch__" };
}

/** Можно ли работать с конкретной записью (с учётом филиала и статуса публикации) */
export function canOnRecord(
  user: PermissionSubject,
  resource: AdminResource,
  action: AdminAction,
  record: { id?: string; branchId?: string | null; status?: PublicationStatus | null },
): boolean {
  if (!can(user, resource, action)) return false;
  const scope = branchScope(user, resource);
  if (scope) {
    const [field, value] = Object.entries(scope)[0];
    if ((record as Record<string, unknown>)[field] !== value) return false;
  }
  // Кто не может публиковать, меняет и удаляет только черновики и записи «на доработке» —
  // опубликованный материал не изменится на сайте без проверки.
  if ((action === "edit" || action === "delete") && record.status && !can(user, resource, "publish")) {
    if (user.role !== "SUPER_ADMIN" && user.role !== "SITE_ADMIN") {
      return record.status === "DRAFT" || record.status === "NEEDS_CHANGES";
    }
  }
  return true;
}

/** Роли, которые администратор сайта не может назначать и менять (только главный администратор) */
export const PROTECTED_ROLES: Role[] = ["SUPER_ADMIN", "SITE_ADMIN"];

export function canManageRole(actor: PermissionSubject, role: Role): boolean {
  if (actor.role === "SUPER_ADMIN") return true;
  return can(actor, "users", "edit") && !PROTECTED_ROLES.includes(role);
}
