// «Календарь памятных дат» (официальные файлы Госархива ВКО за 2022–2026 годы).
// Выбор года и месяца хранится в URL (?year=2026&month=6), чтобы ссылкой можно было поделиться.
import type { Metadata } from "next";
import { CalendarDays, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { htmlLang, type Locale } from "@/i18n/routing";
import { getCalendarYears, getMemorableDates, getMonthCounts, type MemorableDateView } from "@/lib/memory/memorable-dates";
import { pageMetadata } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/memory/calendar">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "calendar", "/memory/calendar");
}

const chip = "inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm font-bold";

export default async function CalendarPage({ params, searchParams }: PageProps<"/[locale]/memory/calendar">) {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const [t, tNav, tPages, years] = await Promise.all([
    getTranslations({ locale, namespace: "Calendar" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getCalendarYears(),
  ]);

  const currentYear = new Date().getFullYear();
  const requestedYear = Number(sp.year);
  const year = years.includes(requestedYear) ? requestedYear : years.includes(currentYear) ? currentYear : years[0];
  const requestedMonth = Number(sp.month);
  const month = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12 ? requestedMonth : undefined;

  const [dates, monthCounts] = year
    ? await Promise.all([getMemorableDates(locale, year, month), getMonthCounts(year)])
    : [[], new Map<number, number>()];

  const monthFormat = new Intl.DateTimeFormat(htmlLang[locale], { month: "long" });
  const monthName = (m: number) => {
    const name = monthFormat.format(new Date(2000, m - 1, 1));
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Группы: месяцы по порядку, в конце — даты, известные только по году
  const groups = new Map<number | null, MemorableDateView[]>();
  for (const d of dates) groups.set(d.month, [...(groups.get(d.month) ?? []), d]);

  const href = (y: number, m?: number) => `/memory/calendar?year=${y}${m ? `&month=${m}` : ""}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tNav("memory"), href: "/memory" }, { label: tPages("calendar.title") }]} />
      <SectionHeading as="h1" title={tPages("calendar.title")} subtitle={tPages("calendar.description")} />

      {locale === "en" && (
        <p className="mb-6 flex items-start gap-2 rounded-[12px] border border-border bg-accent-2-soft px-4 py-3 text-sm">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-2" />
          {t("enNotice")}
        </p>
      )}

      {!year ? (
        <p className="rounded-[12px] border border-dashed border-border bg-surface px-4 py-3 text-muted-ink">{t("empty")}</p>
      ) : (
        <>
          <nav aria-label={t("year")} className="mb-3 flex flex-wrap gap-2">
            {years.map((y) => (
              <Link
                key={y}
                href={href(y, month)}
                aria-current={y === year ? "page" : undefined}
                className={cn(chip, "font-mono", y === year ? "border-ink bg-ink text-bg" : "border-border bg-surface hover:border-primary")}
              >
                {y}
              </Link>
            ))}
          </nav>
          <nav aria-label={t("month")} className="mb-8 flex flex-wrap gap-1.5">
            <Link href={href(year)} aria-current={!month ? "page" : undefined} className={cn(chip, "font-normal", !month ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary")}>
              {t("allMonths")}
            </Link>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const count = monthCounts.get(m) ?? 0;
              if (!count) {
                return (
                  <span key={m} className={cn(chip, "border-dashed border-border font-normal text-muted-ink")} aria-disabled="true">
                    {monthName(m)}
                  </span>
                );
              }
              return (
                <Link
                  key={m}
                  href={href(year, m)}
                  aria-current={m === month ? "page" : undefined}
                  className={cn(chip, "font-normal", m === month ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary")}
                >
                  {monthName(m)}
                  <span className="ml-1.5 font-mono text-xs opacity-75">{count}</span>
                </Link>
              );
            })}
          </nav>

          <p role="status" className="mb-4 font-bold">{t("count", { count: dates.length })}</p>

          {dates.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-border bg-surface px-4 py-3 text-muted-ink">{t("noDates")}</p>
          ) : (
            <div className="space-y-10">
              {[...groups.entries()].map(([m, items]) => (
                <section key={m ?? "year"} aria-labelledby={`month-${m ?? "year"}`}>
                  <h2 id={`month-${m ?? "year"}`} className="mb-3 flex items-center gap-2 font-serif text-2xl font-bold">
                    <CalendarDays aria-hidden className="size-5 text-primary" />
                    {m ? monthName(m) : t("yearOnly")}
                  </h2>
                  <ol className="divide-y divide-border rounded-[14px] border border-border bg-surface">
                    {items.map((d) => (
                      <li key={d.id} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:gap-5">
                        <span className="shrink-0 font-mono text-sm font-bold text-primary sm:w-36">{d.dateLabel}</span>
                        <span className="leading-relaxed">{d.text}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}

          <p className="mt-8 text-sm text-muted-ink">{t("source", { year })}</p>
        </>
      )}
    </div>
  );
}
