// Инструменты ИИ-помощника (tool use). Claude не знает содержимого архива — он может только
// вызвать эти функции, а они читают нашу базу. Поэтому ответ строится на реальных записях:
// выдумать документ помощник не может, ссылки он получает готовыми из результатов инструментов.
// Отдаём только опубликованные данные; персональных данных посетителей здесь нет.
import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { Locale } from "@/i18n/routing";
import { getPublishedDocument } from "@/lib/catalog/get-document";
import { searchFundRegistry } from "@/lib/funds/fund-registry";
import { googleMapsRoute, twoGisRoute } from "@/lib/geo/route-links";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { DOC_TYPES } from "@/lib/search/catalog-filters";
import { parseQuery } from "@/lib/search/query-parser";
import { getPlaceAliases, searchCatalog, type CatalogItem } from "@/lib/search/search-catalog";
import { getBranches } from "@/lib/site/branches";
import { getFaq } from "@/lib/site/pages";

const TOPICS = ["industry", "energy", "construction", "war", "virgin-lands", "agriculture", "education", "science", "culture", "sport", "geology", "governance", "partisans", "city"] as const;

/** Мини-карточка документа для интерфейса чата */
export type AssistantDocument = Pick<CatalogItem, "id" | "title" | "cipher" | "docType" | "yearFrom" | "accessStatus" | "previewUrl" | "isDemo"> & {
  url: string;
};

export type ToolOutcome = { content: string; documents?: AssistantDocument[]; isError?: boolean };

// ─── Схемы входных данных (проверяем всё, что пришло от модели) ───────────────

const searchCatalogInput = z.object({
  query: z.string().max(200).optional(),
  docType: z.enum(DOC_TYPES).optional(),
  place: z.string().max(80).optional(),
  yearFrom: z.number().int().min(1000).max(2100).optional(),
  yearTo: z.number().int().min(1000).max(2100).optional(),
  topic: z.enum(TOPICS).optional(),
  hasDigitalCopy: z.boolean().optional(),
  limit: z.number().int().min(1).max(8).optional(),
});
const getDocumentInput = z.object({ id: z.string().regex(/^[a-z0-9]{10,40}$/) });
const queryInput = z.object({ query: z.string().max(200).optional() });
const fundInput = z.object({ query: z.string().min(1).max(120) });

// ─── Описания инструментов для Claude (порядок и текст не меняются — их кэширует API) ─

export const archiveTools: Anthropic.Tool[] = [
  {
    name: "search_catalog",
    description:
      "Search the archive's electronic catalogue (documents, photos, maps, films). Returns up to 8 published records with id, title, cipher (fund/inventory/file), year, type, access status and the card URL. Use it for any question about materials. Put recognised filters into the fields and leftover keywords into query.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords in the user's language (without words already used as filters)" },
        docType: { type: "string", enum: [...DOC_TYPES], description: "PHOTO, TEXT, MAP_DRAWING, AUDIO_VIDEO, PERSONAL, ORGANIZATION, HISTORICAL" },
        place: { type: "string", description: "Settlement in any spelling: Усть-Каменогорск, Өскемен, Лениногорск (→ Риддер), Зыряновск (→ Алтай)…" },
        yearFrom: { type: "integer" },
        yearTo: { type: "integer" },
        topic: { type: "string", enum: [...TOPICS] },
        hasDigitalCopy: { type: "boolean", description: "Only records with a digital copy (scan)" },
        limit: { type: "integer", minimum: 1, maximum: 8 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_document",
    description: "Full card of one catalogue record by id: description, historical note, dates, place, fund, access status. Use it to summarise or explain a specific document.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false },
  },
  {
    name: "search_funds",
    description: "Search the real list of the archive's funds (register as of 2018, 1667 funds) by fund number (Р-25, 1П) or organisation name. Titles are in Russian.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false },
  },
  {
    name: "get_branches",
    description: "Archive buildings and the 13 district/city branches: address, phone, e-mail, opening hours, route links (2GIS, Google Maps). Optional query filters by town or branch name (old names like Лениногорск work).",
    input_schema: { type: "object", properties: { query: { type: "string" } }, additionalProperties: false },
  },
  {
    name: "get_site_sections",
    description: "Map of the website: sections with links and short descriptions. Use it for navigation questions (where to find…).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_faq",
    description: "Frequently asked questions with official answers (reading room, access to documents, social-legal requests via egov.kz, etc.). Optional query filters by words.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, additionalProperties: false },
  },
];

// ─── Исполнение ──────────────────────────────────────────────────────────────

const docUrl = (locale: Locale, id: string) => `/${locale}/catalog/${id}`;
const toCard = (locale: Locale, item: CatalogItem): AssistantDocument => ({
  id: item.id,
  title: item.title,
  cipher: item.cipher,
  docType: item.docType,
  yearFrom: item.yearFrom,
  accessStatus: item.accessStatus,
  previewUrl: item.previewUrl,
  isDemo: item.isDemo,
  url: docUrl(locale, item.id),
});
// Общие слова в названиях филиалов — по ним филиал не выбираем («Риддерский филиал» → только «риддер»)
const GENERIC_WORD = /^(филиал|branch|район|district|city|town|городск|аудан|қала|облыс|област|archiv|архив|personnel|личн|состав|where|which|какой|где|наход|work|hours|работ|мекенж|қайда)/u;

/** Филиалы, о которых спрашивают: сравниваем начала слов вопроса с названиями городов и филиалов */
export function matchBranches<T extends { searchText: string }>(branches: T[], question: string): T[] {
  const asked = question.toLowerCase().split(/[^\p{L}\d-]+/u).filter((w) => w.length > 3 && !GENERIC_WORD.test(w));
  if (!asked.length) return [];
  return branches.filter((b) =>
    b.searchText.split(/\s+/).some((name) => name.length > 3 && !GENERIC_WORD.test(name) && asked.some((w) => w.slice(0, 5) === name.slice(0, 5))),
  );
}

const words = (q: string | undefined) => (q ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);

export type CatalogToolArgs = z.infer<typeof searchCatalogInput>;

/** Поиск по каталогу — общий для Claude и запасного режима */
/** placeSlugs — уже распознанные места (запасной режим); иначе место берётся из args.place */
export async function runCatalogSearch(args: CatalogToolArgs, locale: Locale, placeSlugs?: string[]) {
  // Место — в любом написании: прогоняем через тот же словарь синонимов, что и каталог
  const places = placeSlugs ?? (args.place ? parseQuery(args.place, await getPlaceAliases()).filters.place : []);
  const result = await searchCatalog(
    {
      text: args.query?.trim() || undefined,
      type: args.docType ? [args.docType] : [],
      place: places,
      topic: args.topic ? [args.topic] : [],
      branch: [],
      access: [],
      from: args.yearFrom,
      to: args.yearTo ?? args.yearFrom,
      digital: args.hasDigitalCopy ? "1" : undefined,
    },
    { locale, pageSize: args.limit ?? 6 },
  );
  return { total: result.total, documents: result.items.map((item) => toCard(locale, item)), places };
}

export async function executeArchiveTool(name: string, input: unknown, locale: Locale): Promise<ToolOutcome> {
  switch (name) {
    case "search_catalog": {
      const args = searchCatalogInput.safeParse(input);
      if (!args.success) return { content: "Invalid input", isError: true };
      const { total, documents } = await runCatalogSearch(args.data, locale);
      return {
        content: JSON.stringify({
          total,
          catalogUrl: `/${locale}/catalog`,
          results: documents.map(({ id, title, cipher, docType, yearFrom, accessStatus, url }) => ({ id, title, cipher, docType, year: yearFrom, accessStatus, url })),
        }),
        documents,
      };
    }
    case "get_document": {
      const args = getDocumentInput.safeParse(input);
      if (!args.success) return { content: "Invalid id", isError: true };
      const doc = await getPublishedDocument(args.data.id);
      if (!doc) return { content: JSON.stringify({ error: "not_found" }) };
      const fund = doc.storageUnit.inventory.fund;
      return {
        content: JSON.stringify({
          id: doc.id,
          url: docUrl(locale, doc.id),
          title: pickLocale(doc, "title", locale),
          cipher: doc.cipher,
          docType: doc.docType,
          years: [doc.yearFrom, doc.yearTo],
          period: pickLocale(doc, "periodLabel", locale),
          place: doc.place ? pickLocale(doc.place, "name", locale) : null,
          author: doc.author,
          fund: { number: fund.number, title: pickLocale(fund, "title", locale) },
          accessStatus: doc.accessStatus,
          hasDigitalCopy: doc.hasDigitalCopy,
          summary: pickLocale(doc, "summary", locale),
          historicalNote: pickLocale(doc, "historicalNote", locale),
          tags: doc.tags.map((t) => pickLocale(t, "name", locale)),
          isDemo: doc.isDemo,
        }),
      };
    }
    case "search_funds": {
      const args = fundInput.safeParse(input);
      if (!args.success) return { content: "Invalid input", isError: true };
      const result = await searchFundRegistry({ q: args.data.query });
      return {
        content: JSON.stringify({
          total: result.total,
          listUrl: `/${locale}/catalog/funds?q=${encodeURIComponent(args.data.query)}`,
          funds: result.items.slice(0, 8).map((f) => ({ number: f.number, title: f.title, years: [f.dateFrom, f.dateTo], note: f.note })),
        }),
      };
    }
    case "get_branches": {
      const args = queryInput.safeParse(input);
      const q = words(args.success ? args.data.query : undefined);
      const branches = await getBranches(locale);
      const matched = q.length ? matchBranches(branches, q.join(" ")) : branches;
      return {
        content: JSON.stringify({
          pageUrl: `/${locale}/branches`,
          branches: (matched.length ? matched : branches).map((b) => ({
            name: b.name,
            address: b.address,
            phone: b.phone,
            email: b.email,
            workHours: b.workHours ?? "not specified",
            readingRoomHours: b.readingRoomHours,
            url: `/${locale}/branches?b=${b.slug}`,
            route2gis: twoGisRoute({ lat: b.lat, lng: b.lng }),
            routeGoogle: googleMapsRoute({ lat: b.lat, lng: b.lng }),
          })),
        }),
      };
    }
    case "get_site_sections": {
      const t = await getTranslations({ locale, namespace: "Pages" });
      const keys = ["catalog", "fundRegistry", "memory", "timeline", "calendar", "exhibitions", "branches", "about", "help", "faq", "news", "feedback", "services", "stateService", "paidServices", "legalActs", "readingRoom", "symbols", "usefulLinks"] as const;
      const paths: Record<(typeof keys)[number], string> = {
        catalog: "/catalog", fundRegistry: "/catalog/funds", memory: "/memory", timeline: "/memory/timeline", calendar: "/memory/calendar",
        exhibitions: "/exhibitions", branches: "/branches", about: "/about", help: "/help", faq: "/faq", news: "/news", feedback: "/feedback",
        services: "/services", stateService: "/services/state", paidServices: "/services/paid", legalActs: "/help/legal-acts",
        readingRoom: "/help/reading-room", symbols: "/help/symbols", usefulLinks: "/help/links",
      };
      return {
        content: JSON.stringify(keys.map((k) => ({ title: t(`${k}.title`), description: t(`${k}.description`), url: `/${locale}${paths[k]}` }))),
      };
    }
    case "get_faq": {
      const args = queryInput.safeParse(input);
      const q = words(args.success ? args.data.query : undefined);
      const faq = await getFaq(locale);
      const score = (item: (typeof faq)[number]) => q.filter((w) => `${item.question} ${item.answer}`.toLowerCase().includes(w.slice(0, 5))).length;
      const ranked = q.length ? [...faq].sort((a, b) => score(b) - score(a)).slice(0, 4) : faq.slice(0, 6);
      return { content: JSON.stringify({ faqUrl: `/${locale}/faq`, items: ranked.map(({ question, answer }) => ({ question, answer })) }) };
    }
    default:
      return { content: `Unknown tool ${name}`, isError: true };
  }
}
