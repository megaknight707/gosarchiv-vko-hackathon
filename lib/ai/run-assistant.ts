// Ядро ИИ-помощника: цикл tool use с Claude и стриминг ответа.
//
// Как работает один вопрос:
//  1. Claude получает системный промпт, описания инструментов и последние сообщения диалога.
//  2. Если ему нужны данные, он отвечает не текстом, а вызовом инструмента (tool_use).
//  3. Мы выполняем инструмент (запрос к нашей базе) и возвращаем результат (tool_result).
//  4. Так до 3 раз; затем Claude пишет ответ, и мы передаём текст клиенту по мере генерации.
// Ошибка API на любом шаге → запасной режим (offlineAnswer), посетитель всё равно получает ответ.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Locale } from "@/i18n/routing";
import { archiveTools, executeArchiveTool, type AssistantDocument } from "./archive-tools";
import { defaultSuggestions, offlineAnswer, type AssistantAnswer } from "./offline-answer";
import { ASSISTANT_SYSTEM_PROMPT } from "./system-prompt";

export const ASSISTANT_MODEL = "claude-haiku-5-5";
const MAX_TOOL_ROUNDS = 3;

export type AssistantMode = "online" | "offline" | "cached";

/** События, которые сервер отправляет клиенту (по одной JSON-строке) */
export type AssistantEvent =
  | { type: "mode"; mode: AssistantMode }
  | { type: "text"; delta: string }
  | { type: "documents"; items: AssistantDocument[] }
  | { type: "suggestions"; items: string[] }
  | { type: "done" };

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function isOnlineAvailable() {
  return process.env.AI_MODE !== "offline" && Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ maxRetries: 1, timeout: 25_000 }));

// Инструменты: поток ввода аргументов сразу по мере генерации; проверяем их сами (zod в executeArchiveTool)
const tools: Anthropic.Tool[] = archiveTools.map((tool) => ({ ...tool, eager_input_streaming: true }));

/**
 * Отвечает через Claude. emit вызывается для каждого фрагмента текста.
 * Возвращает итог для кэша и журнала. При ошибке API бросает исключение (его ловит вызывающий код).
 */
export async function answerWithClaude(history: ChatMessage[], locale: Locale, emit: (event: AssistantEvent) => void): Promise<AssistantAnswer> {
  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  const documents = new Map<string, AssistantDocument>();
  let text = "";

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const stream = getClient().messages.stream({
      model: ASSISTANT_MODEL,
      max_tokens: 1500,
      output_config: { effort: "low" }, // короткие справочные ответы — минимальная глубина рассуждений
      // Системный промпт и инструменты не меняются → API кэширует этот префикс (дешевле и быстрее)
      system: [{ type: "text", text: ASSISTANT_SYSTEM_PROMPT.replace("{locale}", locale), cache_control: { type: "ephemeral" } }],
      tools,
      // После 3 обращений к базе — только ответ, без новых вызовов
      tool_choice: round === MAX_TOOL_ROUNDS ? { type: "none" } : { type: "auto" },
      messages,
    });
    stream.on("text", (delta) => {
      text += delta;
      emit({ type: "text", delta });
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") break;
    const toolUses = message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (toolUses.length === 0) break;
    if (message.stop_reason === "max_tokens") break; // аргументы инструмента обрезаны — не выполняем

    messages.push({ role: "assistant", content: message.content });
    // Все результаты — одним сообщением (так модель может вызывать инструменты параллельно)
    const results = await Promise.all(
      toolUses.map(async (use): Promise<Anthropic.ToolResultBlockParam> => {
        try {
          const outcome = await executeArchiveTool(use.name, use.input, locale);
          outcome.documents?.forEach((d) => documents.set(d.id, d));
          return { type: "tool_result", tool_use_id: use.id, content: outcome.content, is_error: outcome.isError };
        } catch (error) {
          console.error(`Инструмент ${use.name} завершился с ошибкой:`, error);
          return { type: "tool_result", tool_use_id: use.id, content: "Tool failed", is_error: true };
        }
      }),
    );
    messages.push({ role: "user", content: results });
  }

  if (!text.trim()) throw new Error("Пустой ответ модели");
  // Мини-карточки — только документы, на которые помощник действительно сослался в ответе
  const cited = [...documents.values()].filter((d) => text.includes(d.id)).slice(0, 6);
  return { text, documents: cited, suggestions: defaultSuggestions(locale) };
}

export { offlineAnswer };
