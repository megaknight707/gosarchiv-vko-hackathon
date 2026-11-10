// «Перечень фондов» — реальный реестр фондов Госархива ВКО на 2018 год (1 667 фондов).
// Поиск по номеру («Р-25», «1П», «25») и названию, включая прежние названия фонда.
// Состояние поиска и фильтров — в URL (?q=…&series=R&category=1&page=2).
import type { Metadata } from "next";
import Form from "next/form";
import { ArrowRightLeft, FolderOpen, Info, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { parseRegistryFilters, searchFundRegistry, serializeRegistryFilters, type RegistryFilters } from "@/lib/funds/fund-registry";
import { pageMetadata } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/catalog/funds">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "fundRegistry", "/catalog/funds");
}

const ROMAN = ["", "I", "II", "III"];

export default async function FundRegistryPage({ params, searchParams }: PageProps<"/[locale]/catalog/funds">) {
  const locale = (await params).locale as Locale;
  const filters = parseRegistryFilters(await searchParams);
  const [t, tNav, tPages] = await Promise.all([
    getTranslations({ locale, namespace: "FundRegistry" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
  ]);

  let result: Awaited<ReturnType<typeof searchFundRegistry>> | null = null;
  try {
    result = await searchFundRegistry(filters);
  } catch (error) {
    console.error("Ошибка поиска по перечню фондов:", error);
  }

  const link = (f: RegistryFilters) => `/catalog/funds${serializeRegistryFilters(f)}`;
  const chip = (active: boolean) =>
    cn("inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm font-bold", active ? "border-ink bg-ink text-bg" : "border-border bg-surface hover:border-primary");
  const hasFilters = Boolean(filters.q || filters.series || filters.category);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs
        className="mb-4"
        items={[{ label: tNav("home"), href: "/" }, { label: tNav("catalog"), href: "/catalog?view=funds" }, { label: tPages("fundRegistry.title") }]}
      />
      <SectionHeading as="h1" title={tPages("fundRegistry.title")} subtitle={tPages("fundRegistry.description")} />

      <p className="mb-6 flex items-start gap-2 rounded-[12px] border border-border bg-accent-2-soft px-4 py-3 text-sm">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-2" />
        <span>
          {t("sourceNote")}
          {locale !== "ru" && ` ${t("ruOnly")}`}
        </span>
      </p>

      <Form action={`/${locale}/catalog/funds`} role="search" className="mb-4 flex gap-2">
        {filters.series && <input type="hidden" name="series" value={filters.series} />}
        {filters.category && <input type="hidden" name="category" value={filters.category} />}
        <label className="relative flex-1">
          <span className="sr-only">{t("searchLabel")}</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink" />
          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            maxLength={120}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-[10px] border border-border bg-surface pr-3 pl-9"
          />
        </label>
        <button type="submit" className="h-11 rounded-[10px] bg-primary px-5 font-bold text-primary-foreground hover:opacity-90">
          {t("search")}
        </button>
      </Form>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <nav aria-label={t("seriesLabel")} className="flex flex-wrap gap-2">
          {([undefined, "R", "P"] as const).map((series) => (
            <Link key={series ?? "all"} href={link({ ...filters, series, page: undefined })} aria-current={filters.series === series ? "page" : undefined} className={chip(filters.series === series)}>
              {t(`series.${series ?? "all"}`)}
            </Link>
          ))}
        </nav>
        <span aria-hidden className="mx-1 h-6 w-px bg-border" />
        <nav aria-label={t("categoryLabel")} className="flex flex-wrap gap-2">
          {[1, 2, 3].map((category) => {
            const active = filters.category === category;
            return (
              <Link key={category} href={link({ ...filters, category: active ? undefined : category, page: undefined })} aria-current={active ? "page" : undefined} className={chip(active)}>
                {t("category", { n: ROMAN[category] })}
              </Link>
            );
          })}
        </nav>
        {hasFilters && (
          <Link href="/catalog/funds" className="ml-auto text-sm font-bold text-primary hover:underline">
            {t("reset")}
          </Link>
        )}
      </div>

      {!result ? (
        <p className="rounded-[12px] border border-dashed border-border bg-surface px-4 py-3 text-muted-ink">{t("error")}</p>
      ) : (
        <>
          <p role="status" className="mb-3 font-bold">{t("found", { count: result.total })}</p>
          {result.items.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-border bg-surface px-4 py-3 text-muted-ink">{t("empty")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-[14px] border border-border bg-surface">
              {result.items.map((fund) => (
                <li key={fund.id} className="flex gap-3 p-4">
                  <FolderOpen aria-hidden className="mt-0.5 hidden size-5 shrink-0 text-primary sm:block" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <code className="font-mono text-sm font-bold">{t("fundN", { number: fund.number })}</code>
                      {fund.category && (
                        <span className="rounded border border-border px-1.5 text-xs text-muted-ink uppercase">{t("category", { n: ROMAN[fund.category] })}</span>
                      )}
                      {fund.series === "P" && <span className="text-xs text-muted-ink">{t("series.P")}</span>}
                    </p>
                    <p className="mt-1 font-serif leading-snug font-bold">{fund.title}</p>
                    <p className="mt-1 text-sm text-muted-ink">
                      {[
                        fund.dateFrom && fund.dateTo ? t("years", { from: fund.dateFrom, to: fund.dateTo }) : null,
                        fund.unitsLabel ? t("units", { units: fund.unitsLabel }) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {fund.note && (
                      <p className="mt-2 inline-flex items-start gap-1.5 rounded-md bg-lock-soft px-2.5 py-1 text-sm text-lock">
                        <ArrowRightLeft aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                        {fund.note}
                      </p>
                    )}
                    {fund.names.length > 0 && (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer font-bold text-primary">{t("history", { count: fund.names.length })}</summary>
                        <ol className="mt-2 space-y-1.5 border-l-2 border-border pl-3">
                          {fund.names.map((n, i) => (
                            <li key={i}>
                              {n.dates && <span className="mr-2 font-mono text-xs text-muted-ink">{n.dates}</span>}
                              {n.name}
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <CatalogPagination locale={locale} page={result.page} pageCount={result.pageCount} buildHref={(page) => link({ ...filters, page })} />
        </>
      )}
    </div>
  );
}
