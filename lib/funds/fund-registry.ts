// Перечень (реестр) фондов архива: поиск по номеру и названию (включая прежние названия),
// фильтры по серии и категории, постраничный вывод. Данные — реальный реестр на 2018 год.
import "server-only";
import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";

export const REGISTRY_PAGE_SIZE = 30;

const optionalText = z
  .string()
  .trim()
  .max(120)
  .transform((v) => v || undefined)
  .optional();

const registryFiltersSchema = z.object({
  q: optionalText,
  series: z.enum(["R", "P"]).optional().catch(undefined),
  category: z.coerce.number().int().min(1).max(3).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});

export type RegistryFilters = z.infer<typeof registryFiltersSchema>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseRegistryFilters(sp: Record<string, string | string[] | undefined>): RegistryFilters {
  const parsed = registryFiltersSchema.safeParse({
    q: first(sp.q),
    series: first(sp.series),
    category: first(sp.category) || undefined,
    page: first(sp.page) || undefined,
  });
  return parsed.success ? parsed.data : {};
}

export function serializeRegistryFilters(f: RegistryFilters): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.series) params.set("series", f.series);
  if (f.category) params.set("category", String(f.category));
  if (f.page && f.page > 1) params.set("page", String(f.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** «Р-25», «р 25», «R-25», «Ф. Р-25» → «р25»; «1П», «1 п» → «1п»; иначе null (ищем по названию) */
export function parseFundNumber(q: string): string | null {
  const s = q.toLowerCase().replace(/^ф(онд)?\.?\s*(№\s*)?/u, "").trim();
  const soviet = s.match(/^(?:р|r)\s*-?\s*(\d{1,5})(?:\s*ч\.?\s*с\.?)?$/u);
  if (soviet) return `р${Number(soviet[1])}`;
  const party = s.match(/^(\d{1,5})\s*-?\s*(?:п|p)(?:\s*\/?\s*ч\.?\s*с\.?)?$/u);
  if (party) return `${Number(party[1])}п`;
  return null;
}

export type RegistryItem = {
  id: string;
  number: string;
  series: string;
  title: string;
  names: { dates: string | null; name: string }[];
  category: number | null;
  dateFrom: number | null;
  dateTo: number | null;
  unitsLabel: string | null;
  note: string | null;
};

export async function searchFundRegistry(filters: RegistryFilters) {
  const page = filters.page ?? 1;
  const conditions: Prisma.Sql[] = [];
  let relevance: Prisma.Sql = Prisma.empty; // при поиске по названию — сначала точные совпадения
  if (filters.series) conditions.push(Prisma.sql`"series" = ${filters.series}`);
  if (filters.category) conditions.push(Prisma.sql`"category" = ${filters.category}`);

  if (filters.q) {
    const key = parseFundNumber(filters.q);
    const digits = /^\d{1,5}$/.test(filters.q) ? Number(filters.q) : null;
    if (key) {
      conditions.push(Prisma.sql`"numberKey" = ${key}`);
    } else if (digits !== null) {
      // Просто число — фонды с этим номером в обеих сериях (Р-25 и 25П)
      conditions.push(Prisma.sql`"numberSort" = ${digits}`);
    } else {
      // Название: подстрока (в т. ч. в прежних названиях) или похожее слово — для опечаток
      const like = `%${filters.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      conditions.push(
        Prisma.sql`("title" ILIKE ${like} OR "names"::text ILIKE ${like} OR word_similarity(${filters.q}, "title") > 0.6)`,
      );
      // Точные совпадения в текущем названии — выше, затем по похожести
      relevance = Prisma.sql`(CASE WHEN "title" ILIKE ${like} THEN 1 ELSE 0 END) + word_similarity(${filters.q}, "title") DESC, `;
    }
  }

  const where = conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;
  const offset = (page - 1) * REGISTRY_PAGE_SIZE;

  const [rows, countRows] = await Promise.all([
    db.$queryRaw<RegistryItem[]>`
      SELECT "id", "number", "series", "title", "names", "category", "dateFrom", "dateTo", "unitsLabel", "note"
      FROM "FundRegistryEntry" ${where}
      ORDER BY ${relevance}"series" DESC, "numberSort" ASC, "number" ASC
      LIMIT ${REGISTRY_PAGE_SIZE} OFFSET ${offset}`,
    db.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "FundRegistryEntry" ${where}`,
  ]);
  const total = Number(countRows[0]?.count ?? 0);
  return { items: rows, total, page, pageCount: Math.max(1, Math.ceil(total / REGISTRY_PAGE_SIZE)) };
}

export async function countFundRegistry() {
  try {
    return await db.fundRegistryEntry.count();
  } catch {
    return 0;
  }
}
