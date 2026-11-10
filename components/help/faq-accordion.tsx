"use client";

// Вопросы и ответы: поиск, группировка по темам (тема задаётся в админке) и доступный аккордеон.
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type FaqEntry = { id: string; topic: string; question: string; answer: string };

/** Порядок тем на странице (темы назначаются в админке) */
export const FAQ_TOPICS = ["services", "catalog", "access", "branches", "memory", "site"] as const;

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const t = useTranslations("Faq");
  const tNav = useTranslations("Nav");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set(items[0] ? [items[0].id] : []));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(q));
  }, [items, query]);

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-3xl">
      <label className="relative mb-2 block">
        <span className="sr-only">{t("searchLabel")}</span>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 w-full rounded-[10px] border border-border bg-surface pr-3 pl-9"
        />
      </label>
      <p role="status" className="mb-4 text-sm text-muted-ink">
        {t("count", { count: filtered.length })}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-border p-5 text-muted-ink">
          {t("noResults")}{" "}
          <Link href="/feedback" className="font-bold text-primary hover:underline">
            {tNav("feedback")}
          </Link>
        </p>
      ) : (
        <div className="space-y-8">
          {[...FAQ_TOPICS, "other"].map((topic) => {
            const group = filtered.filter((item) => (FAQ_TOPICS as readonly string[]).includes(item.topic) ? item.topic === topic : topic === "other");
            if (!group.length) return null;
            return (
              <section key={topic} aria-labelledby={`faq-topic-${topic}`}>
                <h2 id={`faq-topic-${topic}`} className="mb-3 text-[13px] font-bold tracking-[.06em] text-muted-ink uppercase">
                  {t(`topics.${topic as (typeof FAQ_TOPICS)[number] | "other"}`)}
                </h2>
                <ul className="divide-y divide-border rounded-[14px] border border-border bg-surface">
                  {group.map((item) => {
                    const expanded = open.has(item.id) || Boolean(query.trim());
                    return (
                      <li key={item.id}>
                        <h3>
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={`faq-${item.id}`}
                            onClick={() => toggle(item.id)}
                            className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left font-serif text-[17px] font-bold hover:text-primary"
                          >
                            {item.question}
                            <ChevronDown aria-hidden className={cn("mt-1 size-5 shrink-0 transition-transform", expanded && "rotate-180")} />
                          </button>
                        </h3>
                        <div id={`faq-${item.id}`} hidden={!expanded} className="px-5 pb-5 leading-relaxed text-muted-ink">
                          {item.answer}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
