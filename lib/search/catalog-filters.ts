// Фильтры каталога: чтение из URL (?type=PHOTO&from=1960&to=1969) с проверкой zod
// и обратная запись в URL. Состояние каталога живёт в адресе — ссылкой можно поделиться.
import { z } from "zod";

export const DOC_TYPES = ["PHOTO", "TEXT", "MAP_DRAWING", "AUDIO_VIDEO", "PERSONAL", "ORGANIZATION", "HISTORICAL"] as const;
export const ACCESS_STATUSES = ["OPEN", "DESCRIPTION_ONLY", "RESTRICTED"] as const;
export const SORTS = ["relevance", "date_asc", "date_desc", "title"] as const;
export const PAGE_SIZE = 12;
export const YEAR_MIN = 1900;
export const YEAR_MAX = new Date().getFullYear();

export type DocType = (typeof DOC_TYPES)[number];
export type AccessStatusValue = (typeof ACCESS_STATUSES)[number];
export type CatalogSort = (typeof SORTS)[number];

const slug = z.string().trim().regex(/^[a-z0-9-]{1,60}$/);
const number = z.string().trim().max(20).regex(/^[\p{L}\d-]+$/u);
const year = z.coerce.number().int().min(1000).max(2100);

/** Список значений: ?type=PHOTO&type=TEXT или ?type=PHOTO,TEXT. Невалидные значения отбрасываются */
function list<T extends z.ZodType>(item: T) {
  return z.preprocess((value) => {
    const raw = Array.isArray(value) ? value : value == null ? [] : [value];
    return raw.flatMap((v) => String(v).split(",")).map((v) => v.trim()).filter(Boolean);
  }, z.array(z.unknown()).transform((values) => values.flatMap((v) => {
    const parsed = item.safeParse(v);
    return parsed.success ? [parsed.data as z.infer<T>] : [];
  })).transform((values) => [...new Set(values)].slice(0, 20)));
}

/** Необязательное значение: если не прошло проверку — просто игнорируем (не ломаем страницу) */
function optional<T extends z.ZodType>(schema: T) {
  return z
    .unknown()
    .transform((value): z.infer<T> | undefined => {
      const raw = Array.isArray(value) ? value[0] : value;
      if (raw == null || raw === "") return undefined;
      const parsed = schema.safeParse(raw);
      return parsed.success ? (parsed.data as z.infer<T>) : undefined;
    })
    .optional();
}

export const catalogFiltersSchema = z.object({
  q: optional(z.string().trim().max(200)),
  type: list(z.enum(DOC_TYPES)),
  place: list(slug),
  topic: list(slug),
  branch: list(slug),
  access: list(z.enum(ACCESS_STATUSES)),
  from: optional(year),
  to: optional(year),
  author: optional(z.string().trim().max(100)),
  fund: optional(number),
  inv: optional(number),
  unit: optional(number),
  digital: optional(z.literal("1")),
  sort: optional(z.enum(SORTS)),
  page: optional(z.coerce.number().int().min(1).max(1000)),
  view: optional(z.enum(["docs", "funds"])),
  /** Флаг: запрос уже разобран, распознанные значения перенесены в фильтры */
  p: optional(z.literal("1")),
});

export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

export function parseCatalogFilters(searchParams: Record<string, string | string[] | undefined>): CatalogFilters {
  const filters = catalogFiltersSchema.parse(searchParams);
  if (filters.from && filters.to && filters.from > filters.to) {
    [filters.from, filters.to] = [filters.to, filters.from];
  }
  return filters;
}

/** Фильтры → строка запроса. Пустые значения не пишутся, массивы — через запятую */
export function serializeCatalogFilters(filters: Partial<CatalogFilters>): string {
  const params = new URLSearchParams();
  const order: (keyof CatalogFilters)[] = ["q", "type", "place", "from", "to", "topic", "branch", "access", "digital", "author", "fund", "inv", "unit", "sort", "view", "p", "page"];
  for (const key of order) {
    const value = filters[key];
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    if (key === "page" && value === 1) continue;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Есть ли хоть один фильтр, кроме сортировки/страницы/вида */
export function hasActiveFilters(filters: CatalogFilters): boolean {
  return Boolean(
    filters.q || filters.type.length || filters.place.length || filters.topic.length || filters.branch.length ||
      filters.access.length || filters.from || filters.to || filters.author || filters.fund || filters.inv ||
      filters.unit || filters.digital,
  );
}
