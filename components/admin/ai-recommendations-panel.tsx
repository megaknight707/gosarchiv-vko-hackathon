"use client";

// Кнопка «Рекомендации ИИ» и список рекомендаций. Генерируется только по нажатию.
import { Sparkles } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState } from "react";
import { recommendationsAction, type RecommendationsState } from "@/lib/admin/analytics-actions";

export function AiRecommendationsPanel({ locale, days }: { locale: string; days: number }) {
  const t = useTranslations("Admin.analytics");
  const format = useFormatter();
  const [state, action, pending] = useActionState(recommendationsAction, {} as RecommendationsState);

  return (
    <section aria-labelledby="ai-recs" className="rounded-[12px] border border-primary/25 bg-chip p-4">
      <h2 id="ai-recs" className="flex items-center gap-2 font-serif text-lg font-bold">
        <Sparkles aria-hidden className="size-4 text-primary" />
        {t("aiTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted-ink">{t("aiIntro")}</p>
      <form action={action} className="mt-3 flex flex-wrap gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="days" value={days} />
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full border border-primary bg-surface px-4 py-2 text-sm font-bold text-primary disabled:opacity-60">
          <Sparkles aria-hidden className="size-4" />
          {pending ? t("aiLoading") : t("aiButton")}
        </button>
        {state.result && (
          <button type="submit" name="refresh" value="1" disabled={pending} className="rounded-full px-3 py-2 text-sm text-primary underline">
            {t("aiRefresh")}
          </button>
        )}
      </form>
      {state.error && <p role="alert" className="mt-2 text-sm text-primary">{t("aiError")}</p>}
      {state.result && (
        <div aria-live="polite" className="mt-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {state.result.items.map((item, i) => (
              <li key={i}>
                <b>{item.title}</b>
                <span className="block text-muted-ink">{item.reason}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-ink">
            {state.result.mode === "online" ? t("aiOnline") : t("aiOffline")} · {format.dateTime(new Date(state.result.createdAt), { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      )}
    </section>
  );
}
