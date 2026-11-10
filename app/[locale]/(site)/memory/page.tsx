// «Архив памяти» (ТЗ §5.6): тематические направления, коллекции, хронология, личности,
// поиск материалов по тематике / периоду / населённому пункту в режиме «галерея» или «список».
import type { Metadata } from "next";
import Image from "next/image";
import Form from "next/form";
import { CalendarDays, CalendarRange, Hourglass, LayoutGrid, List, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { parseCatalogFilters, serializeCatalogFilters } from "@/lib/search/catalog-filters";
import { searchCatalog } from "@/lib/search/search-catalog";
import { getDirections, getMemorySearchOptions, listCollections } from "@/lib/memory/memory";
import { isDemoMode } from "@/lib/site/config";
import { pageMetadata } from "@/lib/site/page-metadata";
import { AccessStamp } from "@/components/archive/access-stamp";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { DocumentCard } from "@/components/archive/document-card";
import { SectionHeading } from "@/components/archive/section-heading";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/memory">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "memory", "/memory");
}

export default async function MemoryPage({ params, searchParams }: PageProps<"/[locale]/memory">) {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const filters = parseCatalogFilters(sp);
  const view = sp.view === "list" ? "list" : "gallery";
  const searching = Boolean(filters.topic.length || filters.place.length || filters.from || filters.to);

  const [t, tNav, tPages, tCatalog, directions, collections, options, result] = await Promise.all([
    getTranslations({ locale, namespace: "Memory" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Catalog" }),
    getDirections(),
    listCollections(locale),
    getMemorySearchOptions(locale),
    searching ? searchCatalog({ ...filters, type: [], access: [] }, { locale, pageSize: 24 }).catch(() => null) : Promise.resolve(null),
  ]);
  const searchHref = (v: "gallery" | "list") =>
    `/memory${serializeCatalogFilters({ topic: filters.topic, place: filters.place, from: filters.from, to: filters.to })}${searching ? "&" : "?"}view=${v}#search`;
  const select = "h-10 w-full rounded-[10px] border border-border bg-surface px-2";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("memory.title") }]} />
      <SectionHeading as="h1" title={tPages("memory.title")} subtitle={tPages("memory.description")} />

      {/* Хронология, личности, календарь памятных дат */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/memory/timeline", title: t("timelineCard"), text: t("timelineText"), Icon: CalendarRange },
          { href: "/memory/persons", title: t("personsCard"), text: t("personsText"), Icon: Users },
          { href: "/memory/calendar", title: t("calendarCard"), text: t("calendarText"), Icon: CalendarDays },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="group flex items-start gap-4 rounded-[16px] border border-border bg-surface p-5 hover:border-primary">
            <card.Icon aria-hidden className="size-8 shrink-0 text-primary" />
            <span>
              <span className="block font-serif text-xl font-bold group-hover:text-primary">{card.title}</span>
              <span className="text-muted-ink">{card.text}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Направления */}
      <section aria-labelledby="directions-title" className="mb-14">
        <SectionHeading title={t("directionsTitle")} subtitle={t("directionsSubtitle")} />
        <h2 id="directions-title" className="sr-only">{t("directionsTitle")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {directions.map((d) => (
            <li key={d.key}>
              {d.href ? (
                <Link href={d.href} className="flex h-full flex-col rounded-[14px] border border-border bg-surface p-4 hover:border-primary">
                  <span className="font-serif font-bold">{t(`directions.${d.key}`)}</span>
                  <span className="mt-auto pt-2 text-sm text-primary">{t("materials", { count: d.count })} →</span>
                </Link>
              ) : (
                <div className="flex h-full flex-col rounded-[14px] border border-dashed border-border p-4 text-muted-ink">
                  <span className="font-serif font-bold">{t(`directions.${d.key}`)}</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm">
                    <Hourglass aria-hidden className="size-3.5" />
                    {t("preparing")}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Коллекции */}
      <section className="mb-14">
        <SectionHeading title={t("collectionsTitle")} subtitle={t("collectionsSubtitle")} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <li key={c.slug}>
              <Link href={`/memory/collections/${c.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-border bg-surface hover:border-primary">
                <span className="relative block h-40 bg-chip">
                  {c.coverUrl && <Image src={c.coverUrl} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />}
                </span>
                <span className="flex flex-1 flex-col p-4">
                  {c.period && <span className="text-xs tracking-[.1em] text-muted-ink uppercase">{c.period}</span>}
                  <span className="mt-1 font-serif text-lg leading-snug font-bold group-hover:text-primary">{c.title}</span>
                  <span className="mt-1 text-sm text-muted-ink">{c.description}</span>
                  <span className="mt-auto pt-3 text-sm font-bold text-primary">{t("materials", { count: c.count })}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Поиск по материалам */}
      <section id="search" className="scroll-mt-6">
        <SectionHeading title={t("searchTitle")} subtitle={t("searchSubtitle")} />
        <Form action={`/${locale}/memory#search`} className="grid gap-3 rounded-[16px] border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_110px_110px_auto] lg:items-end">
          <input type="hidden" name="view" value={view} />
          <label className="text-sm">
            <span className="mb-1 block text-muted-ink">{t("topic")}</span>
            <select name="topic" defaultValue={filters.topic[0] ?? ""} className={select}>
              <option value="">{t("any")}</option>
              {options.topics.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-ink">{t("place")}</span>
            <select name="place" defaultValue={filters.place[0] ?? ""} className={select}>
              <option value="">{t("any")}</option>
              {options.places.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-ink">{t("yearFrom")}</span>
            <input name="from" inputMode="numeric" defaultValue={filters.from ?? ""} maxLength={4} className={cn(select, "font-mono")} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-ink">{t("yearTo")}</span>
            <input name="to" inputMode="numeric" defaultValue={filters.to ?? ""} maxLength={4} className={cn(select, "font-mono")} />
          </label>
          <button type="submit" className="h-10 rounded-[10px] bg-primary px-5 font-bold text-primary-foreground hover:opacity-90">{t("search")}</button>
        </Form>

        {result && (
          <div className="mt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="font-bold">{tCatalog("found", { count: result.total })}</p>
              <div role="group" aria-label={t("view")} className="inline-flex rounded-full border border-border bg-surface p-1 text-sm font-bold">
                {(["gallery", "list"] as const).map((v) => (
                  <Link key={v} href={searchHref(v)} aria-current={view === v ? "true" : undefined} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1", view === v ? "bg-ink text-bg" : "text-muted-ink")}>
                    {v === "gallery" ? <LayoutGrid aria-hidden className="size-4" /> : <List aria-hidden className="size-4" />}
                    {t(v)}
                  </Link>
                ))}
              </div>
            </div>
            {view === "gallery" ? (
              <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {result.items.map((item) => (
                  <li key={item.id} className="flex">
                    <DocumentCard className="w-full" showDemo={isDemoMode} doc={{ ...item, yearLabel: item.yearFrom ? String(item.yearFrom) : null }} />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="divide-y divide-border rounded-[14px] border border-border bg-surface">
                {result.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                    <span className="w-12 font-mono text-sm text-muted-ink">{item.yearFrom}</span>
                    <Link href={`/catalog/${item.id}`} className="min-w-0 flex-1 font-serif font-bold hover:text-primary hover:underline">{item.title}</Link>
                    <code className="font-mono text-xs text-muted-ink">{item.cipher}</code>
                    <AccessStamp status={item.accessStatus} />
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/catalog${serializeCatalogFilters({ topic: filters.topic, place: filters.place, from: filters.from, to: filters.to })}`} className="mt-4 inline-block font-bold text-primary hover:underline">
              {t("allInCatalog")} →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
