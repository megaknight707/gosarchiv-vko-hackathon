// Поиск по электронному каталогу. Одна функция для страницы каталога и для ИИ-помощника (этап 6).
//
// Как ищет:
//  1. Шифр («Ф. 1520 · Оп. 2 · Д. 14», «1520/2/14») → точное совпадение фонда/описи/дела.
//  2. Текст → полнотекстовый поиск PostgreSQL по колонке searchVector (tsvector):
//     для каждого слова — префиксный запрос в конфигурациях 'russian' (учитывает окончания)
//     и 'simple' (казахский, английский). Плюс нечёткое совпадение названия (pg_trgm) — для опечаток.
//  3. Фильтры (тип, годы, место, филиал, тема, доступ, номера) — условия WHERE.
//  4. Фасеты — сколько документов даёт каждое значение фильтра (без учёта своего же фильтра).
// Все значения передаются в SQL параметрами (Prisma.sql), без склейки строк — защита от SQL-инъекций.
import "server-only";
import { cache } from "react";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import type { Locale } from "@/i18n/routing";
import { type CatalogFilters, type CatalogSort, type DocType, PAGE_SIZE } from "./catalog-filters";
import { normalizeFundNumber, parseCipher } from "./cipher-parser";
import type { PlaceAliases } from "./query-parser";
import { escapeLike, normalizeText } from "./text-normalize";

export type SearchFilters = Pick<
  CatalogFilters,
  "type" | "place" | "topic" | "branch" | "access" | "from" | "to" | "author" | "fund" | "inv" | "unit" | "digital"
> & {
  /** Свободный текст (уже без распознанных фрагментов) */
  text?: string;
};

export type SearchOptions = { page?: number; pageSize?: number; sort?: CatalogSort; locale: Locale };

export type CatalogItem = {
  id: string;
  title: string;
  cipher: string;
  docType: DocType;
  yearFrom: number | null;
  yearTo: number | null;
  sheetsCount: number | null;
  placeName: string | null;
  accessStatus: "OPEN" | "DESCRIPTION_ONLY" | "RESTRICTED";
  hasDigitalCopy: boolean;
  previewUrl: string | null;
  isDemo: boolean;
};

export type FacetValue = { value: string; label: string; count: number };
export type CatalogFacets = {
  type: FacetValue[];
  place: FacetValue[];
  branch: FacetValue[];
  topic: FacetValue[];
  access: FacetValue[];
  digital: number;
};

export type SearchResult = {
  items: CatalogItem[];
  total: number;
  page: number;
  pageCount: number;
  facets: CatalogFacets;
  /** Распознанный шифр, если запрос был шифром */
  cipher: ReturnType<typeof parseCipher>;
};

type Dimension = "type" | "place" | "branch" | "topic" | "access" | "digital";

const LOCALE_COLUMN = { kz: "Kz", ru: "Ru", en: "En" } as const;

/** Места с вариантами написания — для разбора запроса. Кэш на время запроса */
export const getPlaceAliases = cache(async (): Promise<PlaceAliases[]> => {
  const places = await db.place.findMany({ select: { slug: true, aliases: true, nameKz: true, nameRu: true, nameEn: true } });
  return places.map((p) => ({ slug: p.slug, aliases: [...p.aliases, p.nameKz, p.nameRu, p.nameEn] }));
});

/** Слова для полнотекстового поиска: только буквы и цифры, без коротких предлогов */
function searchWords(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((w) => w.length >= 2)
    .slice(0, 8);
}

/** Условия WHERE для всех фильтров, кроме `except` (так считаются фасеты) */
function buildConditions(filters: SearchFilters, except?: Dimension): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [Prisma.sql`d."status" = 'PUBLISHED'`];
  const cipher = filters.text ? parseCipher(filters.text) : null;

  if (cipher) {
    conditions.push(Prisma.sql`upper(f."number") = ${cipher.fund}`);
    if (cipher.inventory) conditions.push(Prisma.sql`i."number" = ${cipher.inventory}`);
    if (cipher.unit) conditions.push(Prisma.sql`su."number" = ${cipher.unit}`);
  } else if (filters.text) {
    const words = searchWords(filters.text);
    const parts: Prisma.Sql[] = [];
    if (words.length > 0) {
      // Для каждого слова: (russian-префикс || simple-префикс); слова объединяются через И
      const tsQuery = Prisma.join(
        words.map((w) => Prisma.sql`(to_tsquery('russian', ${`${w}:*`}) || to_tsquery('simple', ${`${w}:*`}))`),
        " && ",
      );
      parts.push(Prisma.sql`d."searchVector" @@ (${tsQuery})`);
    }
    // Опечатки: нечёткое совпадение со словами названия на любом языке
    parts.push(
      Prisma.sql`GREATEST(word_similarity(${filters.text}, d."titleRu"), word_similarity(${filters.text}, d."titleKz"), word_similarity(${filters.text}, d."titleEn")) > 0.45`,
    );
    parts.push(Prisma.sql`d."cipher" ILIKE ${`%${escapeLike(filters.text)}%`}`);
    conditions.push(Prisma.sql`(${Prisma.join(parts, " OR ")})`);
  }

  if (except !== "type" && filters.type.length) conditions.push(Prisma.sql`d."docType"::text = ANY(${filters.type})`);
  if (except !== "access" && filters.access.length) conditions.push(Prisma.sql`d."accessStatus"::text = ANY(${filters.access})`);
  if (except !== "place" && filters.place.length) conditions.push(Prisma.sql`p."slug" = ANY(${filters.place})`);
  if (except !== "branch" && filters.branch.length) conditions.push(Prisma.sql`b."slug" = ANY(${filters.branch})`);
  if (except !== "digital" && filters.digital) conditions.push(Prisma.sql`d."hasDigitalCopy" = true`);
  if (except !== "topic" && filters.topic.length) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "_ArchiveDocumentToTag" dt JOIN "Tag" t ON t."id" = dt."B"
      WHERE dt."A" = d."id" AND t."slug" = ANY(${filters.topic}))`);
  }
  // Период: документ пересекается с интервалом [from; to]
  if (filters.from) conditions.push(Prisma.sql`COALESCE(d."yearTo", d."yearFrom") >= ${filters.from}`);
  if (filters.to) conditions.push(Prisma.sql`COALESCE(d."yearFrom", d."yearTo") <= ${filters.to}`);
  if (filters.author) conditions.push(Prisma.sql`d."author" ILIKE ${`%${escapeLike(filters.author)}%`}`);
  if (filters.fund) conditions.push(Prisma.sql`upper(f."number") = ${normalizeFundNumber(filters.fund)}`);
  if (filters.inv) conditions.push(Prisma.sql`i."number" = ${filters.inv}`);
  if (filters.unit) conditions.push(Prisma.sql`su."number" = ${filters.unit}`);

  return conditions;
}

const FROM_CLAUSE = Prisma.sql`
  FROM "ArchiveDocument" d
  JOIN "StorageUnit" su ON su."id" = d."storageUnitId"
  JOIN "Inventory" i ON i."id" = su."inventoryId"
  JOIN "Fund" f ON f."id" = i."fundId"
  LEFT JOIN "Place" p ON p."id" = d."placeId"
  LEFT JOIN "Branch" b ON b."id" = d."branchId"`;

function orderBy(sort: CatalogSort, filters: SearchFilters, locale: Locale): Prisma.Sql {
  const title = Prisma.raw(`d."title${LOCALE_COLUMN[locale]}"`);
  switch (sort) {
    case "date_desc":
      return Prisma.sql`d."yearFrom" DESC NULLS LAST, ${title} ASC`;
    case "title":
      return Prisma.sql`${title} ASC`;
    case "relevance": {
      const words = filters.text ? searchWords(filters.text) : [];
      if (words.length === 0 || parseCipher(filters.text ?? "")) return Prisma.sql`d."yearFrom" ASC NULLS LAST, ${title} ASC`;
      const tsQuery = Prisma.join(
        words.map((w) => Prisma.sql`(to_tsquery('russian', ${`${w}:*`}) || to_tsquery('simple', ${`${w}:*`}))`),
        " || ",
      );
      return Prisma.sql`(ts_rank(d."searchVector", ${tsQuery}) + word_similarity(${filters.text}, ${title})) DESC, d."yearFrom" ASC NULLS LAST`;
    }
    case "date_asc":
    default:
      return Prisma.sql`d."yearFrom" ASC NULLS LAST, ${title} ASC`;
  }
}

async function countBy(filters: SearchFilters, dimension: Dimension, locale: Locale): Promise<FacetValue[]> {
  const where = Prisma.join(buildConditions(filters, dimension), " AND ");
  const suffix = LOCALE_COLUMN[locale];
  let rows: { value: string; label: string | null; count: bigint }[];
  switch (dimension) {
    case "type":
      rows = await db.$queryRaw`SELECT d."docType"::text AS value, NULL AS label, count(*) AS count ${FROM_CLAUSE} WHERE ${where} GROUP BY 1`;
      break;
    case "access":
      rows = await db.$queryRaw`SELECT d."accessStatus"::text AS value, NULL AS label, count(*) AS count ${FROM_CLAUSE} WHERE ${where} GROUP BY 1`;
      break;
    case "place":
      rows = await db.$queryRaw`SELECT p."slug" AS value, ${Prisma.raw(`p."name${suffix}"`)} AS label, count(*) AS count
        ${FROM_CLAUSE} WHERE ${where} AND p."id" IS NOT NULL GROUP BY 1, 2`;
      break;
    case "branch":
      rows = await db.$queryRaw`SELECT b."slug" AS value, ${Prisma.raw(`b."name${suffix}"`)} AS label, count(*) AS count
        ${FROM_CLAUSE} WHERE ${where} AND b."id" IS NOT NULL GROUP BY 1, 2`;
      break;
    case "topic":
      rows = await db.$queryRaw`SELECT t."slug" AS value, ${Prisma.raw(`t."name${suffix}"`)} AS label, count(*) AS count
        ${FROM_CLAUSE} JOIN "_ArchiveDocumentToTag" dt ON dt."A" = d."id" JOIN "Tag" t ON t."id" = dt."B"
        WHERE ${where} GROUP BY 1, 2`;
      break;
    case "digital":
      rows = await db.$queryRaw`SELECT 'digital' AS value, NULL AS label, count(*) AS count
        ${FROM_CLAUSE} WHERE ${where} AND d."hasDigitalCopy" = true`;
      break;
  }
  return rows
    .map((r) => ({ value: r.value, label: r.label ?? r.value, count: Number(r.count) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function searchCatalog(filters: SearchFilters, options: SearchOptions): Promise<SearchResult> {
  const { locale } = options;
  const pageSize = Math.min(options.pageSize ?? PAGE_SIZE, 50);
  const sort = options.sort ?? (filters.text ? "relevance" : "date_asc");
  const where = Prisma.join(buildConditions(filters), " AND ");
  const suffix = LOCALE_COLUMN[locale];

  const [countRows, facetType, facetPlace, facetBranch, facetTopic, facetAccess, facetDigital] = await Promise.all([
    db.$queryRaw<{ count: bigint }[]>`SELECT count(*) AS count ${FROM_CLAUSE} WHERE ${where}`,
    countBy(filters, "type", locale),
    countBy(filters, "place", locale),
    countBy(filters, "branch", locale),
    countBy(filters, "topic", locale),
    countBy(filters, "access", locale),
    countBy(filters, "digital", locale),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), pageCount);

  const rows = await db.$queryRaw<
    (Omit<CatalogItem, "title" | "placeName"> & { titleLocal: string; titleRu: string; placeLocal: string | null })[]
  >`
    SELECT d."id", ${Prisma.raw(`d."title${suffix}"`)} AS "titleLocal", d."titleRu", d."cipher", d."docType"::text AS "docType",
      d."yearFrom", d."yearTo", d."sheetsCount", d."accessStatus"::text AS "accessStatus", d."hasDigitalCopy", d."isDemo",
      ${Prisma.raw(`p."name${suffix}"`)} AS "placeLocal",
      CASE WHEN d."accessStatus" = 'OPEN' THEN (
        SELECT df."previewUrl" FROM "DigitalFile" df WHERE df."documentId" = d."id" ORDER BY df."pageNumber" LIMIT 1
      ) END AS "previewUrl"
    ${FROM_CLAUSE}
    WHERE ${where}
    ORDER BY ${orderBy(sort, filters, locale)}
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

  return {
    items: rows.map(({ titleLocal, titleRu, placeLocal, ...row }) => ({
      ...row,
      title: titleLocal?.trim() ? titleLocal : titleRu,
      placeName: placeLocal,
    })),
    total,
    page,
    pageCount,
    facets: {
      type: facetType,
      place: facetPlace,
      branch: facetBranch,
      topic: facetTopic,
      access: facetAccess,
      digital: facetDigital[0]?.count ?? 0,
    },
    cipher: filters.text ? parseCipher(filters.text) : null,
  };
}

/** Запись в журнал поиска — без IP и персональных данных (для аналитики «что ищут и не находят») */
export async function logSearch(entry: {
  query: string;
  locale: Locale;
  parsedFilters: unknown;
  resultsCount: number;
  source: "CATALOG" | "AI";
}) {
  try {
    await db.searchLog.create({
      data: {
        query: entry.query.slice(0, 200),
        locale: entry.locale,
        parsedFilters: entry.parsedFilters as Prisma.InputJsonValue,
        resultsCount: entry.resultsCount,
        source: entry.source,
      },
    });
  } catch (error) {
    console.error("Не удалось записать поисковый запрос:", error);
  }
}
