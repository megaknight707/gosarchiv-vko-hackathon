// Импорт документов каталога из CSV (ТЗ §6.3): проверка каждой строки с понятным отчётом
// «строка 7: год должен быть числом», затем создание корректных строк как черновиков.
// Фонд должен существовать; опись и дело создаются автоматически, если их ещё нет.
import "server-only";
import { z } from "zod";
import { formatCipher } from "@/lib/archive/cipher";
import { db } from "@/lib/db";
import type { AccessStatus, DocType } from "@/lib/generated/prisma/client";
import { parseCsv, toCsv } from "./csv";

export const IMPORT_COLUMNS = [
  "fund",
  "inventory",
  "unit",
  "titleRu",
  "titleKz",
  "titleEn",
  "docType",
  "yearFrom",
  "yearTo",
  "accessStatus",
  "summaryRu",
  "summaryKz",
  "summaryEn",
  "place",
  "author",
  "language",
  "sheetsCount",
] as const;

const REQUIRED_COLUMNS = ["fund", "inventory", "unit", "titleRu", "docType", "yearFrom", "summaryRu"] as const;
const DOC_TYPES = ["PHOTO", "TEXT", "MAP_DRAWING", "AUDIO_VIDEO", "PERSONAL", "ORGANIZATION", "HISTORICAL"] as const;
const ACCESS = ["OPEN", "DESCRIPTION_ONLY", "RESTRICTED"] as const;
export const MAX_IMPORT_ROWS = 1000;

export type ImportIssue = { line: number; column: string; code: string };
export type ImportRow = {
  line: number;
  fund: string;
  inventory: string;
  unit: string;
  titleRu: string;
  titleKz: string;
  titleEn: string;
  docType: DocType;
  yearFrom: number;
  yearTo: number | null;
  accessStatus: AccessStatus;
  summaryRu: string;
  summaryKz: string;
  summaryEn: string;
  place: string;
  author: string;
  language: string;
  sheetsCount: number | null;
};

const year = z.coerce.number().int().min(1700).max(2100);
const rowSchema = z.object({
  fund: z.string().trim().min(1).max(40),
  inventory: z.string().trim().min(1).max(40),
  unit: z.string().trim().min(1).max(40),
  titleRu: z.string().trim().min(1).max(300),
  titleKz: z.string().trim().max(300),
  titleEn: z.string().trim().max(300),
  docType: z.enum(DOC_TYPES),
  yearFrom: year,
  yearTo: z.union([z.literal("").transform(() => null), year]),
  accessStatus: z.union([z.literal("").transform(() => "OPEN" as const), z.enum(ACCESS)]),
  summaryRu: z.string().trim().min(1).max(5000),
  summaryKz: z.string().trim().max(5000),
  summaryEn: z.string().trim().max(5000),
  place: z.string().trim().max(200),
  author: z.string().trim().max(300),
  language: z.string().trim().max(40),
  sheetsCount: z.union([z.literal("").transform(() => null), z.coerce.number().int().min(0).max(100000)]),
});

function issueCode(issue: z.core.$ZodIssue): string {
  if (issue.code === "too_small") return issue.origin === "string" ? "required" : "range";
  if (issue.code === "too_big") return issue.origin === "string" ? "tooLong" : "range";
  if (issue.code === "invalid_value") return String(issue.path[0]) === "docType" ? "docType" : "access";
  if (issue.code === "invalid_union") return String(issue.path[0]) === "accessStatus" ? "access" : "number";
  return "number";
}

export type ImportCheck = { rows: ImportRow[]; issues: ImportIssue[]; total: number; headerError?: string };

export async function checkImport(text: string): Promise<ImportCheck> {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], issues: [], total: 0, headerError: "empty" };
  const header = table[0].map((h) => h.trim());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) return { rows: [], issues: [], total: 0, headerError: `missing:${missing.join(", ")}` };
  if (table.length - 1 > MAX_IMPORT_ROWS) return { rows: [], issues: [], total: table.length - 1, headerError: "tooMany" };

  const funds = new Set((await db.fund.findMany({ select: { number: true } })).map((f) => f.number));
  const rows: ImportRow[] = [];
  const issues: ImportIssue[] = [];
  const seen = new Set<string>();

  table.slice(1).forEach((cells, index) => {
    const line = index + 2; // строка в файле: первая — заголовок
    const raw = Object.fromEntries(IMPORT_COLUMNS.map((column) => [column, cells[header.indexOf(column)] ?? ""]));
    raw.docType = raw.docType.trim().toUpperCase();
    raw.accessStatus = raw.accessStatus.trim().toUpperCase();
    const parsed = rowSchema.safeParse(raw);
    const rowIssues: ImportIssue[] = parsed.success ? [] : parsed.error.issues.map((issue) => ({ line, column: String(issue.path[0]), code: issueCode(issue) }));
    if (parsed.success) {
      const row = parsed.data;
      if (!funds.has(row.fund)) rowIssues.push({ line, column: "fund", code: "fundNotFound" });
      if (row.yearTo !== null && row.yearTo < row.yearFrom) rowIssues.push({ line, column: "yearTo", code: "order" });
      const key = `${row.fund}|${row.inventory}|${row.unit}|${row.titleRu.toLowerCase()}`;
      if (seen.has(key)) rowIssues.push({ line, column: "titleRu", code: "duplicate" });
      seen.add(key);
      if (!rowIssues.length) rows.push({ line, ...row });
    }
    issues.push(...rowIssues);
  });
  return { rows, issues, total: table.length - 1 };
}

/** Создаёт документы из проверенных строк. Возвращает число созданных записей. */
export async function runImport(rows: ImportRow[], isDemo: boolean): Promise<number> {
  const places = await db.place.findMany();
  const placeFor = (name: string) => {
    const q = name.trim().toLowerCase();
    if (!q) return null;
    return places.find((p) => [p.slug, p.nameRu, p.nameKz, p.nameEn, ...p.aliases].some((v) => v.toLowerCase() === q)) ?? null;
  };

  let created = 0;
  for (const row of rows) {
    const fund = await db.fund.findUnique({ where: { number: row.fund } });
    if (!fund) continue;
    const inventory = await db.inventory.upsert({
      where: { fundId_number: { fundId: fund.id, number: row.inventory } },
      update: {},
      create: { fundId: fund.id, number: row.inventory, titleRu: `Опись ${row.inventory}`, titleKz: `${row.inventory}-тізімдеме`, titleEn: `Inventory ${row.inventory}`, isDemo },
    });
    const unit = await db.storageUnit.upsert({
      where: { inventoryId_number: { inventoryId: inventory.id, number: row.unit } },
      update: {},
      create: { inventoryId: inventory.id, number: row.unit, titleRu: `Дело ${row.unit}`, titleKz: `${row.unit}-іс`, titleEn: `File ${row.unit}`, isDemo },
    });
    const place = placeFor(row.place);
    await db.archiveDocument.create({
      data: {
        storageUnitId: unit.id,
        cipher: formatCipher({ fund: fund.number, inventory: inventory.number, unit: unit.number }),
        titleRu: row.titleRu,
        titleKz: row.titleKz,
        titleEn: row.titleEn,
        docType: row.docType,
        yearFrom: row.yearFrom,
        yearTo: row.yearTo,
        accessStatus: row.accessStatus,
        summaryRu: row.summaryRu,
        summaryKz: row.summaryKz || null,
        summaryEn: row.summaryEn || null,
        placeId: place?.id ?? null,
        placeName: place ? null : row.place || null,
        author: row.author || null,
        language: row.language || null,
        sheetsCount: row.sheetsCount,
        branchId: fund.branchId,
        status: "DRAFT",
        isDemo,
      },
    });
    created++;
  }
  return created;
}

/** Шаблон CSV с двумя строками-примерами */
export function importTemplate(): string {
  return toCsv(
    [...IMPORT_COLUMNS],
    [
      ["1520", "2", "14", "Строительство Усть-Каменогорской ГЭС. Фотография", "", "", "PHOTO", "1952", "", "OPEN", "Общий вид строительной площадки.", "", "", "Усть-Каменогорск", "", "ru", "1"],
      ["1520", "2", "15", "Протокол собрания строителей", "", "", "TEXT", "1953", "1954", "DESCRIPTION_ONLY", "Протокол общего собрания.", "", "", "Өскемен", "Управление строительства", "ru", "12"],
    ],
  );
}
