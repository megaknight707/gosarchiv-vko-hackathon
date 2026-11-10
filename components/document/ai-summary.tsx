"use client";

// Кнопка «Кратко от ИИ» в карточке документа. Генерируется только по нажатию (экономия токенов).
import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { DocumentSummary } from "@/lib/ai/document-summary";

export function AiSummary({ id }: { id: string }) {
  const t = useTranslations("Assistant");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [result, setResult] = useState<DocumentSummary | null>(null);

  const load = async () => {
    setState("loading");
    try {
      const response = await fetch("/api/assistant/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, locale }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setResult((await response.json()) as DocumentSummary);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  if (!result) {
    return (
      <div className="mt-5">
        <button
          type="button"
          onClick={load}
          disabled={state === "loading"}
          className="inline-flex items-center gap-2 rounded-full border border-accent-2 px-4 py-2 text-sm font-bold text-accent-2 hover:bg-accent-2-soft disabled:opacity-60"
        >
          <Sparkles aria-hidden className="size-4" />
          {state === "loading" ? t("summaryLoading") : t("summaryButton")}
        </button>
        {state === "error" && <p role="alert" className="mt-2 text-sm text-primary">{t("error")}</p>}
      </div>
    );
  }

  return (
    <section aria-live="polite" className="mt-5 rounded-[14px] border border-accent-2/40 bg-accent-2-soft p-4">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold">
        <Sparkles aria-hidden className="size-4 text-accent-2" />
        {t("summaryTitle")}
      </h2>
      <p className="mt-2 leading-relaxed">{result.summary}</p>
      {result.keyFacts.length > 0 && (
        <>
          <h3 className="mt-3 text-sm font-bold">{t("summaryFacts")}</h3>
          <ul className="mt-1 list-disc pl-5 text-sm marker:text-accent-2">
            {result.keyFacts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
        </>
      )}
      {result.topics.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5">
          {result.topics.map((topic) => (
            <span key={topic} className="rounded-full bg-surface px-2.5 py-0.5 text-xs">{topic}</span>
          ))}
        </p>
      )}
      <p className="mt-3 text-xs text-muted-ink">
        {t("summarySource")}
        {result.mode === "offline" && ` · ${t("offlineMode")}`}
      </p>
    </section>
  );
}
