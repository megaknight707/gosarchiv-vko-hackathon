"use client";

// Плавающая кнопка «Спросить архив» и панель ИИ-помощника.
// Панель — Radix Dialog (Sheet): фокус остаётся внутри, Esc закрывает, фокус возвращается на кнопку.
// Ответ читается потоком (NDJSON) и появляется по мере генерации; новые сообщения объявляются
// скринридеру через aria-live. Ничего, кроме текста вопроса, на сервер не уходит.
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, FileText, Info, RotateCcw, Sparkles, WifiOff, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AssistantDocument } from "@/lib/ai/archive-tools";
import type { AssistantEvent, AssistantMode } from "@/lib/ai/run-assistant";
import { cn } from "@/lib/utils";
import { AssistantMarkdown } from "./assistant-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  documents?: AssistantDocument[];
  suggestions?: string[];
  mode?: AssistantMode;
  pending?: boolean;
};

const MAX_LENGTH = 500;
export const OPEN_ASSISTANT_EVENT = "assistant:open";

/** Открыть помощника из любого места страницы (например, с вопросом из строки поиска) */
export function openAssistant(question?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT, { detail: { question } }));
}

export function AssistantPanel() {
  const t = useTranslations("Assistant");
  const tHeader = useTranslations("Header");
  const tArchive = useTranslations("Archive");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim().slice(0, MAX_LENGTH);
      if (!text || busy) return;
      const history = [...messages.filter((m) => !m.pending), { role: "user" as const, content: text }];
      setMessages([...history, { role: "assistant", content: "", pending: true }]);
      setInput("");
      setBusy(true);

      const update = (patch: (m: Message) => Message) =>
        setMessages((list) => [...list.slice(0, -1), patch(list[list.length - 1])]);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, messages: history.map(({ role, content }) => ({ role, content })).slice(-6) }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          update((m) => ({ ...m, pending: false, content: response.status === 429 ? t("rateLimited") : t("error") }));
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as AssistantEvent;
            if (event.type === "text") update((m) => ({ ...m, content: m.content + event.delta }));
            else if (event.type === "mode") update((m) => ({ ...m, mode: event.mode }));
            else if (event.type === "documents") update((m) => ({ ...m, documents: event.items }));
            else if (event.type === "suggestions") update((m) => ({ ...m, suggestions: event.items }));
            else if (event.type === "done") update((m) => ({ ...m, pending: false }));
          }
        }
        update((m) => ({ ...m, pending: false }));
      } catch (error) {
        if ((error as Error).name !== "AbortError") update((m) => ({ ...m, pending: false, content: m.content || t("error") }));
      } finally {
        setBusy(false);
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [busy, locale, messages, t],
  );

  // Открытие из других компонентов
  useEffect(() => {
    const handler = (event: Event) => {
      setOpen(true);
      const question = (event as CustomEvent<{ question?: string }>).detail?.question;
      if (question) void ask(question);
    };
    window.addEventListener(OPEN_ASSISTANT_EVENT, handler);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, handler);
  }, [ask]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(input);
  };
  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setBusy(false);
    inputRef.current?.focus();
  };
  const close = () => setOpen(false);
  const examples = [t("example1"), t("example2"), t("example3")];
  const last = messages.at(-1);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 inline-flex items-center gap-2 rounded-full bg-primary px-[18px] py-3 font-bold text-primary-foreground shadow-[0_12px_30px_rgba(0,0,0,.3)] transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6 dark:text-[#0f1a1c]">
        <Sparkles aria-hidden className="size-4" />
        {tHeader("askArchive")}
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
        className="w-full gap-0 border-border bg-bg p-0 sm:max-w-md"
      >
        <header className="flex items-start gap-3 border-b border-border bg-surface px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-chip text-primary">
            <Sparkles aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-serif text-lg font-bold">{t("title")}</SheetTitle>
            <SheetDescription className="text-xs text-muted-ink">{t("disclaimer")}</SheetDescription>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={reset} aria-label={t("newChat")} title={t("newChat")} className="grid size-9 place-items-center rounded-full hover:bg-chip">
              <RotateCcw aria-hidden className="size-4" />
            </button>
          )}
          <button type="button" onClick={close} aria-label={t("close")} className="grid size-9 place-items-center rounded-full hover:bg-chip">
            <X aria-hidden className="size-5" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite" aria-busy={busy}>
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="rounded-[14px] border border-border bg-surface p-3.5 text-sm leading-relaxed">{t("greeting")}</div>
              <p className="text-xs font-bold tracking-[.06em] text-muted-ink uppercase">{t("tryAsking")}</p>
              <ul className="space-y-2">
                {examples.map((example) => (
                  <li key={example}>
                    <button type="button" onClick={() => void ask(example)} className="w-full rounded-[12px] border border-border bg-surface px-3 py-2 text-left text-sm hover:border-primary">
                      {example}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((message, index) =>
            message.role === "user" ? (
              <div key={index} className="ml-auto max-w-[85%] rounded-[14px] rounded-br-sm bg-ink px-3.5 py-2.5 text-sm text-bg">
                {message.content}
              </div>
            ) : (
              <div key={index} className="max-w-[95%] space-y-2.5">
                {message.mode === "offline" && (
                  <p className="inline-flex items-center gap-1.5 rounded-md bg-lock-soft px-2 py-0.5 text-xs text-lock">
                    <WifiOff aria-hidden className="size-3.5" />
                    {t("offlineMode")}
                  </p>
                )}
                <div className="rounded-[14px] rounded-bl-sm border border-border bg-surface px-3.5 py-2.5 text-sm">
                  {message.content ? (
                    <AssistantMarkdown text={message.content} onNavigate={close} />
                  ) : (
                    <span className="inline-flex items-center gap-2 text-muted-ink">
                      <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden />
                      {t("thinking")}
                    </span>
                  )}
                </div>
                {/* Дополнения к ТЗ §3.4: ответ ИИ помечается как автоматически сформированный */}
                {message.content && !message.pending && <p className="px-1 text-[11px] text-muted-ink">{t("autoGenerated")}</p>}
                {message.documents && message.documents.length > 0 && (
                  <ul className="grid gap-2" aria-label={t("foundDocuments")}>
                    {message.documents.map((doc) => (
                      <li key={doc.id}>
                        <Link href={doc.url} onClick={close} className="flex items-center gap-3 rounded-[12px] border border-border bg-surface p-2 hover:border-primary">
                          <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-chip">
                            {doc.previewUrl ? (
                              <Image src={doc.previewUrl} alt="" fill unoptimized={doc.previewUrl.startsWith("/api/files/")} sizes="48px" className="object-cover" />
                            ) : (
                              <FileText aria-hidden className="size-5 text-muted-ink" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 text-sm font-bold">{doc.title}</span>
                            <span className="block truncate font-mono text-xs text-muted-ink">
                              {doc.cipher} · {tArchive(`docType.${doc.docType}`)}
                              {doc.yearFrom ? ` · ${doc.yearFrom}` : ""}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {message === last && !message.pending && message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {message.suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => void ask(s)} className="rounded-full border border-border bg-surface px-3 py-1 text-xs hover:border-primary">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}
        </div>

        <form onSubmit={submit} className="border-t border-border bg-surface px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="sr-only">{t("inputLabel")}</span>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(input);
                  }
                }}
                rows={2}
                maxLength={MAX_LENGTH}
                placeholder={t("placeholder")}
                className="block max-h-32 w-full resize-none rounded-[12px] border border-border bg-bg px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t("send")}
              className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground", (busy || !input.trim()) && "opacity-50")}
            >
              <ArrowUp aria-hidden className="size-5" />
            </button>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-ink">
            <Info aria-hidden className="size-3" />
            {t("footnote")}
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}
