// Новости и события (ТЗ §5.11): категории, поиск, сортировка по дате, пагинация.
import type { Metadata } from "next";
import Form from "next/form";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { htmlLang, type Locale } from "@/i18n/routing";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { listNews, NEWS_CATEGORIES, newsQuerySchema, type NewsQuery } from "@/lib/site/news";
import { pageMetadata } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { EmptyState } from "@/components/archive/empty-state";
import { SectionHeading } from "@/components/archive/section-heading";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/news">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "news", "/news");
}

function href(query: NewsQuery, changes: Partial<NewsQuery>) {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  if (next.category) params.set("category", next.category);
  if (next.q) params.set("q", next.q);
  if (next.sort) params.set("sort", next.sort);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  const s = params.toString();
  return `/news${s ? `?${s}` : ""}`;
}

export default async function NewsPage({ params, searchParams }: PageProps<"/[locale]/news">) {
  const locale = (await params).locale as Locale;
  const query = newsQuerySchema.parse(await searchParams);
  const [t, tNav, tPages, tCatalog, result] = await Promise.all([
    getTranslations({ locale, namespace: "News" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Catalog" }),
    listNews(query, locale),
  ]);
  const date = new Intl.DateTimeFormat(htmlLang[locale], { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("news.title") }]} />
      <SectionHeading as="h1" title={tPages("news.title")} subtitle={tPages("news.description")} />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label={t("categoryFilter")} className="flex flex-wrap gap-1.5">
          {([undefined, ...NEWS_CATEGORIES] as const).map((category) => (
            <Link
              key={category ?? "ALL"}
              href={href(query, { category, page: undefined })}
              aria-current={query.category === category ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-bold",
                query.category === category ? "border-ink bg-ink text-bg" : "border-border bg-surface hover:bg-chip",
              )}
            >
              {t(`categories.${category ?? "ALL"}`)}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <Form action={`/${locale}/news`} role="search" className="flex gap-2">
            {query.category && <input type="hidden" name="category" value={query.category} />}
            <label className="relative">
              <span className="sr-only">{t("searchLabel")}</span>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink" />
              <input name="q" type="search" defaultValue={query.q ?? ""} maxLength={100} className="h-10 w-56 rounded-[10px] border border-border bg-surface pr-3 pl-9" />
            </label>
            <button type="submit" className="h-10 rounded-[10px] bg-primary px-4 font-bold text-primary-foreground">
              {tCatalog("submit")}
            </button>
          </Form>
          <Link href={href(query, { sort: query.sort === "old" ? undefined : "old", page: undefined })} className="h-10 rounded-[10px] border border-border bg-surface px-3 py-2 text-sm font-bold hover:bg-chip">
            {query.sort === "old" ? t("sortOldest") : t("sortNewest")} ⇅
          </Link>
        </div>
      </div>

      {result.items.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((item) => (
            <li key={item.id}>
              <article className="flex h-full flex-col rounded-[14px] border border-border bg-surface p-5">
                <p className="flex flex-wrap gap-x-2 text-sm text-muted-ink">
                  {item.publishedAt && <time dateTime={item.publishedAt.toISOString()}>{date.format(item.publishedAt)}</time>}
                  <span aria-hidden>·</span>
                  <span>{t(`categories.${item.category}`)}</span>
                </p>
                <h2 className="mt-2 font-serif text-lg leading-snug font-bold">
                  <Link href={`/news/${item.slug}`} className="hover:text-primary hover:underline">
                    {pickLocale(item, "title", locale)}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-muted-ink">{pickLocale(item, "excerpt", locale)}</p>
                {item.branch && <p className="mt-3 text-sm">{t("branch", { name: pickLocale(item.branch, "name", locale) })}</p>}
                <Link href={`/news/${item.slug}`} className="mt-auto pt-4 text-sm font-bold text-primary hover:underline">
                  {t("readMore")} →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}

      {result.pageCount > 1 && (
        <nav aria-label={tCatalog("pagination")} className="mt-8 flex justify-center gap-2">
          {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href(query, { page: n })}
              aria-current={n === result.page ? "page" : undefined}
              className={cn("grid size-10 place-items-center rounded-[10px] border border-border font-bold", n === result.page ? "bg-ink text-bg" : "bg-surface hover:bg-chip")}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
