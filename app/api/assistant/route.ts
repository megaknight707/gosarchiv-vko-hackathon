// POST /api/assistant — ИИ-помощник. Ответ приходит потоком: одна JSON-строка на событие
// ({ type: "text", delta }, { type: "documents", items }, …), чтобы текст появлялся по мере генерации.
//
// Экономия и защита:
//  - проверка Origin (запросы только с нашего сайта) и zod-валидация тела;
//  - вопрос ≤ 500 символов, в модель уходят только последние 6 сообщений;
//  - кэш AiCache: одинаковый первый вопрос на том же языке в течение 24 ч отвечается из базы, без API;
//  - лимит: 10 вопросов к Claude за 5 минут с одного (обезличенного) адреса, дальше — запасной режим;
//    больше 40 за 5 минут — отказ 429;
//  - ошибка API, нет ключа или AI_MODE=offline → запасной режим без ИИ.
import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { answerWithClaude, isOnlineAvailable, offlineAnswer, type AssistantEvent, type AssistantMode } from "@/lib/ai/run-assistant";
import type { AssistantAnswer } from "@/lib/ai/offline-answer";
import { logSearch } from "@/lib/search/search-catalog";
import { normalizeText } from "@/lib/search/text-normalize";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { siteUrl } from "@/lib/site/config";

export const maxDuration = 60;

const bodySchema = z.object({
  locale: z.enum(routing.locales),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4000) }))
    .min(1)
    .max(20)
    .transform((list) => list.slice(-6))
    .refine((list) => list.at(-1)?.role === "user", "last message must be from user")
    .refine((list) => list.at(-1)!.content.length <= 500, "question too long"),
});

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === request.nextUrl.origin || origin === new URL(siteUrl).origin;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { locale, messages } = parsed.data;
  const question = messages.at(-1)!.content;

  if (!(await checkRateLimit("assistant-any", 40, 300))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // Кэшируем только первый вопрос диалога: ответ на продолжение зависит от истории
  const cacheKey = messages.length === 1 ? createHash("sha256").update(normalizeText(question)).digest("hex") : null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (event: AssistantEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const finish = (answer: AssistantAnswer) => {
        emit({ type: "documents", items: answer.documents });
        emit({ type: "suggestions", items: answer.suggestions });
        emit({ type: "done" });
      };

      let mode: AssistantMode = "offline";
      let answer: AssistantAnswer | null = null;
      try {
        // 1. Кэш
        if (cacheKey) {
          const cached = await db.aiCache.findUnique({ where: { queryHash_locale: { queryHash: cacheKey, locale } } });
          if (cached && Date.now() - cached.createdAt.getTime() < CACHE_TTL_MS) {
            mode = "cached";
            answer = cached.response as unknown as AssistantAnswer;
            console.info(`[assistant] ответ из кэша, токены не потрачены (${locale})`);
            emit({ type: "mode", mode });
            emit({ type: "text", delta: answer.text });
            finish(answer);
            return;
          }
        }

        // 2. Claude — если доступен и лимит не исчерпан
        if (isOnlineAvailable() && (await checkRateLimit("assistant", 10, 300))) {
          emit({ type: "mode", mode: "online" });
          let streamed = false;
          try {
            answer = await answerWithClaude(messages, locale, (event) => {
              streamed = true;
              emit(event);
            });
            mode = "online";
          } catch (error) {
            console.error("[assistant] Claude API недоступен, переключаюсь на запасной режим:", error);
            if (streamed) emit({ type: "text", delta: "\n\n" });
          }
        }

        // 3. Запасной режим
        if (!answer) {
          answer = await offlineAnswer(question, locale as Locale);
          mode = "offline";
          emit({ type: "mode", mode });
          emit({ type: "text", delta: answer.text });
        }
        finish(answer);

        if (cacheKey && mode === "online") {
          const data = { response: answer as unknown as Prisma.InputJsonValue, createdAt: new Date() };
          await db.aiCache
            .upsert({ where: { queryHash_locale: { queryHash: cacheKey, locale } }, create: { queryHash: cacheKey, locale, ...data }, update: data })
            .catch((error) => console.error("[assistant] не удалось сохранить кэш:", error));
        }
      } catch (error) {
        console.error("[assistant] ошибка:", error);
        emit({ type: "text", delta: locale === "en" ? "Sorry, something went wrong." : locale === "kz" ? "Кешіріңіз, қате орын алды." : "Извините, произошла ошибка." });
        emit({ type: "done" });
      } finally {
        await logSearch({
          query: question,
          locale,
          parsedFilters: { mode },
          resultsCount: answer?.documents.length ?? 0,
          source: "AI",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
