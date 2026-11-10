// Работа с базой для универсального CRUD: список (поиск, фильтр, сортировка, страницы),
// одна запись, справочники для выпадающих списков. Модель Prisma берётся из конфигурации.
import "server-only";
import type { Locale } from "@/i18n/routing";
import { formatCipher } from "@/lib/archive/cipher";
import { branchScope, type PermissionSubject } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import type { PublicationStatus } from "@/lib/generated/prisma/client";
import { pickLocale } from "@/lib/i18n/pick-locale";
import type { EntityConfig, RelationSource } from "./entity-config";

/** Общие методы делегатов Prisma (db.fund, db.news, …), которыми пользуется CRUD */
type Row = Record<string, unknown> & { id: string };
type Delegate = {
  findMany(args: object): Promise<Row[]>;
  findUnique(args: object): Promise<Row | null>;
  count(args: object): Promise<number>;
  create(args: object): Promise<Row>;
  update(args: object): Promise<Row>;
  delete(args: object): Promise<Row>;
};

export function delegateFor(config: EntityConfig): Delegate {
  return (db as unknown as Record<string, Delegate>)[config.model];
}

export const PAGE_SIZE = 25;

export const STATUSES: PublicationStatus[] = ["DRAFT", "IN_REVIEW", "NEEDS_CHANGES", "APPROVED", "PUBLISHED", "ARCHIVED"];

export type ListParams = { q?: string; status?: string; sort?: string; dir?: string; page?: number };

export function recordTitle(config: EntityConfig, record: Record<string, unknown>, locale: Locale): string {
  const { name, localized } = config.titleField;
  const value = localized ? pickLocale(record as Record<string, string>, name, locale) : record[name];
  return String(value || record.id);
}

export async function listEntities(config: EntityConfig, user: PermissionSubject, params: ListParams) {
  const where: Record<string, unknown> = { ...(branchScope(user, config.key) ?? {}) };
  if (config.moderated && params.status && STATUSES.includes(params.status as PublicationStatus)) {
    where.status = params.status;
  }
  const q = params.q?.trim().slice(0, 100);
  if (q) where.OR = config.searchFields.map((field) => ({ [field]: { contains: q, mode: "insensitive" } }));

  const sortable = new Set(config.columns.filter((c) => c.sortable).map((c) => (c.localized ? `${c.name}Ru` : c.name)));
  const sort = params.sort && sortable.has(params.sort) ? params.sort : config.defaultSort.field;
  const dir = params.dir === "asc" || params.dir === "desc" ? params.dir : config.defaultSort.direction;
  const page = Math.max(1, Math.min(params.page ?? 1, 10_000));

  const delegate = delegateFor(config);
  const [rows, total] = await Promise.all([
    delegate.findMany({
      where,
      orderBy: [{ [sort]: dir }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      ...(config.listInclude ? { include: config.listInclude } : {}),
    }),
    delegate.count({ where }),
  ]);
  return { rows, total, page, sort, dir, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getEntityRecord(config: EntityConfig, id: string) {
  return delegateFor(config).findUnique({
    where: { id },
    ...(config.key === "documents" ? { include: { tags: { select: { id: true } } } } : {}),
  });
}

export type Option = { value: string; label: string };

/** Варианты для выпадающих списков формы (только те справочники, что нужны конфигурации) */
export async function loadRelationOptions(
  config: EntityConfig,
  locale: Locale,
  user: PermissionSubject,
): Promise<Partial<Record<RelationSource | "tags", Option[]>>> {
  const sources = new Set(config.fields.flatMap((f) => (f.type === "relation" ? [f.source] : f.type === "tags" ? ["tags" as const] : [])));
  const result: Partial<Record<RelationSource | "tags", Option[]>> = {};
  const name = (row: { nameKz: string; nameRu: string; nameEn: string }) => pickLocale(row, "name", locale);
  const title = (row: { titleKz: string; titleRu: string; titleEn: string }) => pickLocale(row, "title", locale);

  await Promise.all(
    [...sources].map(async (source) => {
      switch (source) {
        case "branch": {
          const where = user.role === "BRANCH_ADMIN" ? { id: user.branchId ?? "__none__" } : {};
          const rows = await db.branch.findMany({ where, orderBy: { sortOrder: "asc" } });
          result.branch = rows.map((r) => ({ value: r.id, label: name(r) }));
          break;
        }
        case "category": {
          const rows = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
          result.category = rows.map((r) => ({ value: r.id, label: name(r) }));
          break;
        }
        case "place": {
          const rows = await db.place.findMany({ orderBy: { nameRu: "asc" } });
          result.place = rows.map((r) => ({ value: r.id, label: name(r) }));
          break;
        }
        case "fund": {
          const rows = await db.fund.findMany({ orderBy: { number: "asc" } });
          result.fund = rows.map((r) => ({ value: r.id, label: `Ф. ${r.number} — ${title(r)}` }));
          break;
        }
        case "inventory": {
          const rows = await db.inventory.findMany({ include: { fund: true }, orderBy: [{ fund: { number: "asc" } }, { number: "asc" }] });
          result.inventory = rows.map((r) => ({ value: r.id, label: `Ф. ${r.fund.number} · Оп. ${r.number} — ${title(r)}` }));
          break;
        }
        case "storageUnit": {
          const rows = await db.storageUnit.findMany({
            include: { inventory: { include: { fund: true } } },
            orderBy: [{ inventory: { fund: { number: "asc" } } }, { inventory: { number: "asc" } }, { number: "asc" }],
          });
          result.storageUnit = rows.map((r) => ({
            value: r.id,
            label: `${formatCipher({ fund: r.inventory.fund.number, inventory: r.inventory.number, unit: r.number })} — ${title(r)}`,
          }));
          break;
        }
        case "exhibition": {
          const rows = await db.exhibition.findMany({ orderBy: { sortOrder: "asc" } });
          result.exhibition = rows.map((r) => ({ value: r.id, label: title(r) }));
          break;
        }
        case "document": {
          const rows = await db.archiveDocument.findMany({ orderBy: { cipher: "asc" }, take: 1000 });
          result.document = rows.map((r) => ({ value: r.id, label: `${r.cipher} — ${title(r)}` }));
          break;
        }
        case "tags": {
          const rows = await db.tag.findMany({ orderBy: { nameRu: "asc" } });
          result.tags = rows.map((r) => ({ value: r.id, label: name(r) }));
          break;
        }
      }
    }),
  );
  return result;
}

/** Похожие документы по названию (pg_trgm) — подсказка «Возможный дубликат» */
export async function findPossibleDuplicates(id: string, titleRu: string) {
  if (!titleRu.trim()) return [];
  return db.$queryRaw<{ id: string; cipher: string; titleRu: string; score: number }[]>`
    SELECT id, cipher, "titleRu", similarity("titleRu", ${titleRu}) AS score
    FROM "ArchiveDocument"
    WHERE id <> ${id} AND similarity("titleRu", ${titleRu}) > 0.55
    ORDER BY score DESC
    LIMIT 3`;
}
