// Электронный каталог (ТЗ §5.3). Все параметры — в адресе страницы:
//   /ru/catalog?q=...&type=PHOTO&place=ust-kamenogorsk&from=1960&to=1969&sort=date_asc&page=2
// Результаты рендерятся на сервере (быстро и видно поисковикам).
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { isDemoMode } from "@/lib/site/config";
import { pageMetadata } from "@/lib/site/page-metadata";
import { hasActiveFilters, parseCatalogFilters, serializeCatalogFilters, type CatalogFilters } from "@/lib/search/catalog-filters";
import { parseCipher } from "@/lib/search/cipher-parser";
import { parseQuery } from "@/lib/search/query-parser";
import { getPlaceAliases, logSearch, searchCatalog, type SearchResult } from "@/lib/search/search-catalog";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { DocumentCard } from "@/components/archive/document-card";
import { EmptyState } from "@/components/archive/empty-state";
import { SectionHeading } from "@/components/archive/section-heading";
import { CatalogFiltersPanel } from "@/components/catalog/catalog-filters-panel";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { CatalogSearchBar } from "@/components/catalog/catalog-search-bar";
import { CatalogSortSelect } from "@/components/catalog/catalog-sort-select";
import { FundsList, FundTree } from "@/components/catalog/funds-view";
import { MobileFilters } from "@/components/catalog/mobile-filters";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/catalog">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "catalog", "/catalog");
}

type Chip = { key: string; label: string; href: string };

export default async function CatalogPage({ params, searchParams }: PageProps<"/[locale]/catalog">) {
  const locale = (await params).locale as Locale;
  const filters = parseCatalogFilters(await searchParams);
  const [t, tNav, tPages, tArchive] = await Promise.all([
    getTranslations({ locale, namespace: "Catalog" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Archive" }),
  ]);

  // ── 1. Разбор строки запроса ─────────────────────────────────────────────
  let text: string | undefined;
  let recognized: ReturnType<typeof parseQuery>["filters"] | null = null;
  const cipher = filters.q ? parseCipher(filters.q) : null;
  if (filters.q && filters.view !== "funds") {
    if (cipher) {
      text = filters.q;
    } else {
      const parsed = parseQuery(filters.q, await getPlaceAliases());
      text = parsed.freeText || undefined;
      recognized = parsed.filters;
      // Первый показ запроса: распознанное (тип, место, годы) переносим в фильтры адреса.
      // Флаг p=1 говорит, что запрос уже разобран — снятый пользователем фильтр не вернётся.
      if (!filters.p) {
        const merged: CatalogFilters = { ...filters, p: "1", page: undefined };
        let changed = false;
        if (parsed.filters.type.length) [merged.type, changed] = [parsed.filters.type, true];
        if (parsed.filters.place.length) [merged.place, changed] = [parsed.filters.place, true];
        if (parsed.filters.topic.length) [merged.topic, changed] = [parsed.filters.topic, true];
        if (parsed.filters.from !== undefined) [merged.from, merged.to, changed] = [parsed.filters.from, parsed.filters.to, true];
        if (changed) redirect(`/${locale}/catalog${serializeCatalogFilters(merged)}`);
      }
    }
  }

  const view = filters.view ?? "docs";
  const viewTabs = (
    <div role="tablist" aria-label={t("viewLabel")} className="inline-flex rounded-full border border-border bg-surface p-1 text-sm font-bold">
      {(["docs", "funds"] as const).map((v) => (
        <Link
          key={v}
          role="tab"
          aria-selected={view === v}
          href={v === "docs" ? `/catalog${serializeCatalogFilters({ ...filters, view: undefined, fund: undefined })}` : "/catalog?view=funds"}
          className={cn("rounded-full px-4 py-1.5", view === v ? "bg-ink text-bg" : "text-muted-ink hover:text-ink")}
        >
          {v === "docs" ? t("viewDocs") : t("viewFunds")}
        </Link>
      ))}
    </div>
  );

  const header = (
    <>
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("catalog.title") }]} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading as="h1" title={tPages("catalog.title")} className="mb-0" />
        <div className="flex flex-wrap items-center gap-3">
          {/* Дополнения к ТЗ §2: удобная точка перехода к личным фондам */}
          <Link href="/catalog?view=funds#group-personal" className="text-sm font-bold text-primary underline-offset-4 hover:underline">
            {t("personalFundsLink")}
          </Link>
          {viewTabs}
        </div>
      </div>
    </>
  );

  // ── Вид «Фонды» ───────────────────────────────────────────────────────────
  if (view === "funds") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
        {header}
        {filters.fund ? <FundTree locale={locale} fundNumber={filters.fund} /> : <FundsList locale={locale} />}
      </div>
    );
  }

  // ── 2. Поиск ─────────────────────────────────────────────────────────────
  const sort = filters.sort ?? (text ? "relevance" : "date_asc");
  let result: SearchResult | null = null;
  try {
    result = await searchCatalog({ ...filters, text }, { locale, page: filters.page, sort });
  } catch (error) {
    console.error("Ошибка поиска по каталогу:", error);
  }

  // Поиск по полному шифру с единственным результатом — сразу открываем карточку
  if (result && cipher?.unit && result.total === 1 && !hasOtherFilters(filters)) {
    const id = result.items[0].id;
    after(() => logSearch({ query: filters.q!, locale, parsedFilters: { cipher }, resultsCount: 1, source: "CATALOG" }));
    redirect(`/${locale}/catalog/${id}`);
  }

  if (result && result.page === 1 && hasActiveFilters(filters)) {
    const logged = { query: filters.q ?? "", resultsCount: result.total };
    after(() =>
      logSearch({
        ...logged,
        locale,
        parsedFilters: { type: filters.type, place: filters.place, from: filters.from, to: filters.to, topic: filters.topic, text },
        source: "CATALOG",
      }),
    );
  }

  // ── 3. Чипы «Поняли запрос так» — каждый можно снять ─────────────────────
  const chips: Chip[] = [];
  if (recognized && filters.p) {
    const remove = (changes: Partial<CatalogFilters>) => `/catalog${serializeCatalogFilters({ ...filters, ...changes, page: undefined })}`;
    for (const type of recognized.type.filter((v) => filters.type.includes(v))) {
      chips.push({ key: `type-${type}`, label: tArchive(`docType.${type}`), href: remove({ type: filters.type.filter((v) => v !== type) }) });
    }
    for (const slug of recognized.place.filter((v) => filters.place.includes(v))) {
      const label = result?.facets.place.find((p) => p.value === slug)?.label ?? slug;
      chips.push({ key: `place-${slug}`, label, href: remove({ place: filters.place.filter((v) => v !== slug) }) });
    }
    for (const slug of recognized.topic.filter((v) => filters.topic.includes(v))) {
      const label = result?.facets.topic.find((p) => p.value === slug)?.label ?? slug;
      chips.push({ key: `topic-${slug}`, label, href: remove({ topic: filters.topic.filter((v) => v !== slug) }) });
    }
    if (recognized.from !== undefined && filters.from === recognized.from && filters.to === recognized.to) {
      const label = recognized.from === recognized.to ? String(recognized.from) : t("chipPeriod", { from: recognized.from, to: recognized.to! });
      chips.push({ key: "period", label, href: remove({ from: undefined, to: undefined }) });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      {header}
      <div className="grid gap-8 lg:grid-cols-[270px_1fr]">
        {result && (
          <aside aria-label={t("filters")} className="hidden self-start rounded-[14px] border border-border bg-surface p-5 lg:block">
            <CatalogFiltersPanel filters={filters} facets={result.facets} />
          </aside>
        )}

        <div className="min-w-0">
          <CatalogSearchBar key={filters.q ?? ""} filters={filters} />

          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[14px] bg-accent-2-soft px-4 py-3 text-sm">
              <span className="font-bold text-accent-2">✦ {t("recognized")}</span>
              {chips.map((chip) => (
                <Link
                  key={chip.key}
                  href={chip.href}
                  aria-label={t("removeFilter", { label: chip.label })}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 hover:border-primary"
                >
                  {chip.label}
                  <X aria-hidden className="size-3.5" />
                </Link>
              ))}
            </div>
          )}
          {cipher && <p className="mt-3 font-mono text-sm text-muted-ink">{t("cipherSearch", { cipher: filters.q! })}</p>}

          {result ? (
            <>
              <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3">
                <p role="status" className="text-muted-ink">
                  <b className="text-ink">{t("found", { count: result.total })}</b>
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <MobileFilters filters={filters} facets={result.facets} total={result.total} />
                  <CatalogSortSelect filters={filters} effectiveSort={sort} />
                </div>
              </div>

              {/* Заголовок для экранного диктора: карточки (h3) идут после h2 — правильная иерархия */}
              <h2 className="sr-only">{t("resultsHeading")}</h2>
              {result.items.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                  {result.items.map((item) => (
                    <li key={item.id} className="flex">
                      <DocumentCard
                        className="w-full"
                        showDemo={isDemoMode}
                        doc={{
                          ...item,
                          yearLabel: item.yearFrom && item.yearTo && item.yearFrom !== item.yearTo ? `${item.yearFrom}–${item.yearTo}` : item.yearFrom ? String(item.yearFrom) : null,
                          extraLabel: item.sheetsCount ? t("sheets", { count: item.sheetsCount }) : null,
                        }}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t("empty")} text={t("emptyHint")} className="py-10">
                  <ul className="mt-4 flex flex-wrap justify-center gap-2" aria-label={t("examples")}>
                    {(["example1", "example2", "example3"] as const).map((key) => (
                      <li key={key}>
                        <Link href={`/catalog?q=${encodeURIComponent(t(key))}`} className="inline-block rounded-full border border-border bg-bg px-3 py-1 text-sm hover:border-primary">
                          {t(key)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {hasActiveFilters(filters) && (
                    <Link href="/catalog" className="mt-5 inline-block rounded-[10px] border border-border px-4 py-2 font-bold hover:bg-chip">
                      {t("reset")}
                    </Link>
                  )}
                </EmptyState>
              )}

              <CatalogPagination locale={locale} filters={filters} page={result.page} pageCount={result.pageCount} />
            </>
          ) : (
            <EmptyState className="mt-6" title={t("empty")} text={t("emptyHint")} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Есть ли фильтры кроме самого шифра (тогда не перескакиваем в карточку) */
function hasOtherFilters(filters: CatalogFilters): boolean {
  return Boolean(filters.type.length || filters.place.length || filters.topic.length || filters.branch.length || filters.access.length || filters.from || filters.to || filters.digital || filters.author);
}
