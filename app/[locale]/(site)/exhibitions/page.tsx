// Список онлайн-выставок с фильтром по теме и периоду (параметры в адресе).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { listExhibitions, type ExhibitionCard } from "@/lib/memory/exhibitions";
import { pageMetadata } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { EmptyState } from "@/components/archive/empty-state";
import { SectionHeading } from "@/components/archive/section-heading";
import { ExhibitionCardLink } from "@/components/exhibitions/exhibition-card";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/exhibitions">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "exhibitions", "/exhibitions");
}

const THEMES = ["all", "city", "war", "industry", "persons"] as const;
const PERIODS = { all: null, before1950: [0, 1949], mid: [1950, 1980], after1980: [1981, 3000] } as const;
type PeriodKey = keyof typeof PERIODS;

function matchesPeriod(e: ExhibitionCard, period: PeriodKey) {
  const range = PERIODS[period];
  if (!range || e.yearFrom === null) return true;
  return (e.yearTo ?? e.yearFrom) >= range[0] && e.yearFrom <= range[1];
}

export default async function ExhibitionsPage({ params, searchParams }: PageProps<"/[locale]/exhibitions">) {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const theme = THEMES.includes(sp.theme as (typeof THEMES)[number]) ? (sp.theme as (typeof THEMES)[number]) : "all";
  const period = (Object.keys(PERIODS) as PeriodKey[]).includes(sp.period as PeriodKey) ? (sp.period as PeriodKey) : "all";
  const [t, tNav, tPages, all] = await Promise.all([
    getTranslations({ locale, namespace: "Exhibitions" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    listExhibitions(locale),
  ]);
  const items = all.filter((e) => (theme === "all" || e.theme === theme) && matchesPeriod(e, period));
  const href = (changes: { theme?: string; period?: string }) => {
    const next = { theme, period, ...changes };
    const q = new URLSearchParams();
    if (next.theme !== "all") q.set("theme", next.theme);
    if (next.period !== "all") q.set("period", next.period);
    return `/exhibitions${q.size ? `?${q}` : ""}`;
  };
  const chip = (active: boolean) =>
    cn("rounded-full border px-3 py-1.5 text-sm font-bold", active ? "border-ink bg-ink text-bg" : "border-border bg-surface hover:bg-chip");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("exhibitions.title") }]} />
      <SectionHeading as="h1" title={tPages("exhibitions.title")} subtitle={tPages("exhibitions.description")} />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:justify-between">
        <nav aria-label={t("themeFilter")} className="flex flex-wrap gap-1.5">
          {THEMES.map((value) => (
            <Link key={value} href={href({ theme: value })} aria-current={theme === value ? "page" : undefined} className={chip(theme === value)}>
              {t(`themes.${value}`)}
            </Link>
          ))}
        </nav>
        <nav aria-label={t("periodFilter")} className="flex flex-wrap gap-1.5">
          {(Object.keys(PERIODS) as PeriodKey[]).map((value) => (
            <Link key={value} href={href({ period: value })} aria-current={period === value ? "page" : undefined} className={chip(period === value)}>
              {t(`periods.${value}`)}
            </Link>
          ))}
        </nav>
      </div>

      {items.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-3">
          {items.map((e, i) => (
            <li key={e.slug} className={i === 0 && items.length > 2 ? "lg:col-span-2 lg:row-span-2" : undefined}>
              <ExhibitionCardLink exhibition={e} large={i === 0 && items.length > 2} priority={i === 0} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
