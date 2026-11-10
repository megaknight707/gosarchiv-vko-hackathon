"use client";

// Хронология: на широком экране — горизонтальная лента по десятилетиям, на телефоне — вертикальная.
// Фильтр по теме, переход к десятилетию, раскрытие события с описанием и связанными документами.
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  year: number;
  theme: string;
  title: string;
  description: string | null;
  source: string | null;
  documents: { id: string; cipher: string; title: string }[];
};

const THEMES = ["all", "archive", "region", "war"] as const;
const THEME_COLOR: Record<string, string> = { archive: "bg-primary", region: "bg-accent-2", war: "bg-lock" };

/** Десятилетие события; всё до 1900 года — одной группой «век» */
const decadeOf = (year: number) => (year < 1900 ? Math.floor(year / 100) * 100 : Math.floor(year / 10) * 10);

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  const t = useTranslations("Timeline");
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("all");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => events.filter((e) => theme === "all" || e.theme === theme), [events, theme]);
  const decades = useMemo(() => {
    const groups = new Map<number, TimelineEvent[]>();
    for (const e of filtered) groups.set(decadeOf(e.year), [...(groups.get(decadeOf(e.year)) ?? []), e]);
    return [...groups.entries()];
  }, [filtered]);
  const label = (decade: number) => (decade < 1900 ? `${decade / 100 + 1} в.` : `${decade}-е`);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label={t("themeFilter")} className="flex flex-wrap gap-1.5">
          {THEMES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
              className={cn("rounded-full border px-3 py-1.5 text-sm font-bold", theme === value ? "border-ink bg-ink text-bg" : "border-border bg-surface hover:bg-chip")}
            >
              {value !== "all" && <span aria-hidden className={cn("mr-1.5 inline-block size-2 rounded-full", THEME_COLOR[value])} />}
              {t(`themes.${value}`)}
            </button>
          ))}
        </div>
        <nav aria-label={t("decades")} className="flex flex-wrap gap-1">
          {decades.map(([decade]) => (
            <a key={decade} href={`#decade-${decade}`} className="rounded-md px-2 py-1 font-mono text-sm text-muted-ink hover:bg-chip hover:text-ink">
              {label(decade)}
            </a>
          ))}
        </nav>
      </div>

      {decades.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-border p-5 text-muted-ink">{t("noEvents")}</p>
      ) : (
        <ol className="relative flex flex-col gap-8 border-l-2 border-border pl-6 lg:flex-row lg:gap-6 lg:overflow-x-auto lg:border-t-2 lg:border-l-0 lg:pt-8 lg:pb-4 lg:pl-0">
          {decades.map(([decade, items]) => (
            <li key={decade} id={`decade-${decade}`} className="relative scroll-mt-6 lg:w-72 lg:shrink-0">
              <span aria-hidden className="absolute top-1.5 -left-[33px] size-4 rounded-full border-4 border-bg bg-primary lg:-top-[42px] lg:left-0" />
              <h2 className="font-mono text-lg font-bold text-primary">{label(decade)}</h2>
              <ul className="mt-3 space-y-3">
                {items.map((event) => {
                  const expanded = open === event.id;
                  const hasDetails = Boolean(event.description || event.documents.length || event.source);
                  return (
                    <li key={event.id} className="rounded-[12px] border border-border bg-surface">
                      <button
                        type="button"
                        aria-expanded={hasDetails ? expanded : undefined}
                        disabled={!hasDetails}
                        onClick={() => setOpen(expanded ? null : event.id)}
                        className="flex w-full items-start gap-3 p-3 text-left disabled:cursor-default"
                      >
                        <span aria-hidden className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", THEME_COLOR[event.theme] ?? "bg-muted-ink")} />
                        <span className="flex-1">
                          <span className="block font-mono text-sm font-bold">{event.year}</span>
                          <span className="block leading-snug">{event.title}</span>
                        </span>
                        {hasDetails && <ChevronDown aria-hidden className={cn("mt-1 size-4 shrink-0 transition-transform", expanded && "rotate-180")} />}
                      </button>
                      {expanded && (
                        <div className="space-y-2 border-t border-border px-3 pt-2 pb-3 text-sm">
                          {event.description && <p>{event.description}</p>}
                          {event.documents.length > 0 && (
                            <div>
                              <p className="font-bold">{t("related")}:</p>
                              <ul className="mt-1 space-y-1">
                                {event.documents.map((doc) => (
                                  <li key={doc.id}>
                                    <Link href={`/catalog/${doc.id}`} className="text-primary hover:underline">
                                      {doc.title}
                                    </Link>{" "}
                                    <code className="font-mono text-xs text-muted-ink">{doc.cipher}</code>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {event.source && <p className="text-xs text-muted-ink">{t("source")}: {event.source}</p>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
