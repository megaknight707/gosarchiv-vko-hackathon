// «Кратко от ИИ» для карточки документа: краткое содержание, ключевые даты, имена и события, тематика.
// Источник — только поля этой карточки (описание, историческая справка, даты, место, фонд).
// Результат кэшируется в AiCache навсегда (ключ «summary:<id>»), повторный показ токенов не тратит.
// Без API — собираем ту же структуру из полей карточки (запасной режим).
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Locale } from "@/i18n/routing";
import type { PublishedDocument } from "@/lib/catalog/get-document";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { ASSISTANT_MODEL, isOnlineAvailable } from "./run-assistant";

export type DocumentSummary = { summary: string; keyFacts: string[]; topics: string[]; mode: "online" | "offline" };

const LANGUAGE = { kz: "Kazakh", ru: "Russian", en: "English" } as const;

const summarySchema = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2–3 sentences in plain language" },
    keyFacts: { type: "array", items: { type: "string" }, description: "Up to 5 key dates, names, places or events from the card" },
    topics: { type: "array", items: { type: "string" }, description: "1–3 topics" },
  },
  required: ["summary", "keyFacts", "topics"],
  additionalProperties: false,
} as const;

function cardFacts(doc: PublishedDocument, locale: Locale) {
  return {
    title: pickLocale(doc, "title", locale),
    cipher: doc.cipher,
    type: doc.docType,
    years: [...new Set([doc.yearFrom, doc.yearTo].filter(Boolean))].join("–"),
    period: pickLocale(doc, "periodLabel", locale),
    place: doc.place ? pickLocale(doc.place, "name", locale) : null,
    author: doc.author,
    fund: pickLocale(doc.storageUnit.inventory.fund, "title", locale),
    description: pickLocale(doc, "summary", locale),
    historicalNote: pickLocale(doc, "historicalNote", locale),
    tags: doc.tags.map((t) => pickLocale(t, "name", locale)),
  };
}

function offlineSummary(doc: PublishedDocument, locale: Locale): DocumentSummary {
  const facts = cardFacts(doc, locale);
  return {
    summary: facts.description || facts.title,
    keyFacts: [...new Set([facts.years, facts.place, facts.author, facts.fund].filter((v): v is string => Boolean(v)))],
    topics: facts.tags.slice(0, 3),
    mode: "offline",
  };
}

export async function getDocumentSummary(doc: PublishedDocument, locale: Locale): Promise<DocumentSummary> {
  const queryHash = `summary:${doc.id}:${doc.updatedAt.getTime()}`;
  const cached = await db.aiCache.findUnique({ where: { queryHash_locale: { queryHash, locale } } }).catch(() => null);
  if (cached) return cached.response as unknown as DocumentSummary;
  if (!isOnlineAvailable()) return offlineSummary(doc, locale);

  try {
    const response = await new Anthropic({ maxRetries: 1, timeout: 20_000 }).messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 1200,
      output_config: { effort: "low", format: { type: "json_schema", schema: summarySchema } },
      system:
        "You summarise one archival catalogue card for a museum website visitor. Use only facts present in the card JSON; never add dates, names or events that are not in it. Write in plain, friendly language.",
      messages: [
        {
          role: "user",
          content: `Answer in ${LANGUAGE[locale]}. Catalogue card:\n${JSON.stringify(cardFacts(doc, locale))}`,
        },
      ],
    });
    const block = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (response.stop_reason !== "end_turn" || !block) return offlineSummary(doc, locale);
    const parsed = JSON.parse(block.text) as Omit<DocumentSummary, "mode">;
    const result: DocumentSummary = {
      summary: String(parsed.summary).slice(0, 800),
      keyFacts: (parsed.keyFacts ?? []).slice(0, 5).map(String),
      topics: (parsed.topics ?? []).slice(0, 3).map(String),
      mode: "online",
    };
    await db.aiCache
      .create({ data: { queryHash, locale, response: result as unknown as Prisma.InputJsonValue } })
      .catch(() => {});
    return result;
  } catch (error) {
    console.error("[summary] Claude API недоступен:", error);
    return offlineSummary(doc, locale);
  }
}
