// «Рекомендации ИИ» для сотрудников: агрегированная статистика (без персональных данных) →
// Claude → 5–7 конкретных шагов («Добавить описания по теме X — 23 запроса без результатов»).
// Кэш — сутки (AiCache). Без API — правила по тем же цифрам (запасной режим).
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { ASSISTANT_MODEL, isOnlineAvailable } from "@/lib/ai/run-assistant";
import type { Analytics } from "./analytics";

export type Recommendation = { title: string; reason: string };
export type RecommendationsResult = { items: Recommendation[]; mode: "online" | "offline"; createdAt: string };

const LANGUAGE = { kz: "Kazakh", ru: "Russian", en: "English" } as const;

const schema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Concrete action for archive staff, max 120 chars" },
          reason: { type: "string", description: "Which numbers from the statistics justify it" },
        },
        required: ["title", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["recommendations"],
  additionalProperties: false,
} as const;

const OFFLINE_TEXT = {
  ru: {
    zero: (q: string, n: number) => ({ title: `Добавить описания по теме «${q}»`, reason: `${n} запрос(ов) без результатов` }),
    top: (q: string, n: number) => ({ title: `Подготовить подборку или выставку «${q}»`, reason: `Один из самых частых запросов: ${n}` }),
    ai: (share: number) => ({ title: "Расширить справку и FAQ для ИИ-помощника", reason: `Через помощника идёт ${share}% поисковых запросов` }),
    low: (section: string) => ({ title: `Сделать раздел «${section}» заметнее на главной`, reason: "Меньше всего просмотров за период" }),
  },
  kz: {
    zero: (q: string, n: number) => ({ title: `«${q}» тақырыбы бойынша сипаттамалар қосу`, reason: `Нәтижесіз ${n} сұрау` }),
    top: (q: string, n: number) => ({ title: `«${q}» бойынша топтама немесе көрме дайындау`, reason: `Ең жиі сұраулардың бірі: ${n}` }),
    ai: (share: number) => ({ title: "ИИ-көмекші үшін анықтама мен FAQ-ты кеңейту", reason: `Іздеу сұрауларының ${share}%-ы көмекші арқылы` }),
    low: (section: string) => ({ title: `«${section}» бөлімін басты бетте көрнекі ету`, reason: "Кезеңдегі ең аз қаралым" }),
  },
  en: {
    zero: (q: string, n: number) => ({ title: `Add descriptions on “${q}”`, reason: `${n} searches with no results` }),
    top: (q: string, n: number) => ({ title: `Prepare a collection or exhibition on “${q}”`, reason: `One of the most frequent searches: ${n}` }),
    ai: (share: number) => ({ title: "Extend help pages and FAQ for the AI assistant", reason: `${share}% of searches go through the assistant` }),
    low: (section: string) => ({ title: `Make the “${section}” section more visible on the home page`, reason: "Fewest views in the period" }),
  },
};

function offline(stats: Analytics, locale: Locale): Recommendation[] {
  const text = OFFLINE_TEXT[locale];
  const items: Recommendation[] = [
    ...stats.zeroQueries.slice(0, 3).map((q) => text.zero(q.query, q.count)),
    ...stats.topQueries.filter((q) => q.avgResults > 0).slice(0, 2).map((q) => text.top(q.query, q.count)),
  ];
  if (stats.aiShare >= 20) items.push(text.ai(stats.aiShare));
  const least = stats.views.at(-1);
  if (least && stats.views.length > 3) items.push(text.low(least.section));
  return items.slice(0, 7);
}

export async function getRecommendations(stats: Analytics, locale: Locale, force = false): Promise<RecommendationsResult> {
  const day = new Date().toISOString().slice(0, 10);
  const queryHash = `admin-recommendations:${day}:${stats.days}`;
  if (!force) {
    const cached = await db.aiCache.findUnique({ where: { queryHash_locale: { queryHash, locale } } }).catch(() => null);
    if (cached) return cached.response as unknown as RecommendationsResult;
  }

  let result: RecommendationsResult = { items: offline(stats, locale), mode: "offline", createdAt: new Date().toISOString() };
  if (isOnlineAvailable()) {
    try {
      const summary = {
        periodDays: stats.days,
        sectionViews: stats.views,
        totalSearches: stats.totalSearches,
        aiSharePercent: stats.aiShare,
        topQueries: stats.topQueries,
        zeroResultQueries: stats.zeroQueries,
        feedbackByKind: stats.feedback,
      };
      const response = await new Anthropic({ maxRetries: 1, timeout: 25_000 }).messages.create({
        model: ASSISTANT_MODEL,
        max_tokens: 1500,
        output_config: { effort: "low", format: { type: "json_schema", schema } },
        system:
          "You advise the staff of a regional state archive (East Kazakhstan) on how to improve their informational website. Use only the aggregated statistics provided. Give 5–7 concrete, actionable recommendations (what content to add, describe, digitise or promote), each justified by specific numbers. The site is informational only: never suggest online applications, orders, payments or personal accounts.",
        messages: [{ role: "user", content: `Answer only in ${LANGUAGE[locale]} (no words or characters from other languages). Statistics:\n${JSON.stringify(summary)}` }],
      });
      const block = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      if (response.stop_reason === "end_turn" && block) {
        const parsed = JSON.parse(block.text) as { recommendations: Recommendation[] };
        const items = parsed.recommendations.slice(0, 7).map((r) => ({ title: String(r.title).slice(0, 200), reason: String(r.reason).slice(0, 400) }));
        if (items.length) result = { items, mode: "online", createdAt: new Date().toISOString() };
      }
    } catch (error) {
      console.error("[recommendations] Claude API недоступен:", error);
    }
  }

  await db.aiCache
    .upsert({
      where: { queryHash_locale: { queryHash, locale } },
      create: { queryHash, locale, response: result as unknown as Prisma.InputJsonValue },
      update: { response: result as unknown as Prisma.InputJsonValue, createdAt: new Date() },
    })
    .catch(() => {});
  return result;
}
