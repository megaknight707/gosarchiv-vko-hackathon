// Главная страница (ТЗ §5.1) по макету design-reference/maket-glavnaya.html:
// первый экран с «Спросите архив» → цифры → история в документах → выставки →
// филиалы и новости → полезная информация. Блок соцсетей скрыт: ссылки не предоставлены.
import type { Metadata } from "next";
import Form from "next/form";
import { ArrowRight, BookOpenText, FolderTree, KeyRound, Search, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { htmlLang, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { getBranches } from "@/lib/site/branches";
import { isDemoMode } from "@/lib/site/config";
import { languageAlternates } from "@/lib/site/page-metadata";
import { DocumentCard, type DocumentCardData } from "@/components/archive/document-card";
import { SectionHeading } from "@/components/archive/section-heading";
import { HeroIllustration } from "@/components/home/hero-illustration";
import { HomeBranches } from "@/components/home/home-branches";
import { SocialIcon } from "@/components/layout/social-icon";
import { socials } from "@/lib/site/socials";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: { canonical: `/${locale}`, languages: languageAlternates("/") } };
}

async function getFeaturedDocuments(locale: Locale): Promise<DocumentCardData[]> {
  try {
    const docs = await db.archiveDocument.findMany({
      where: { status: "PUBLISHED", featured: true },
      orderBy: { yearFrom: "asc" },
      take: 4,
      include: {
        place: { select: { nameKz: true, nameRu: true, nameEn: true } },
        files: { where: { pageNumber: 1 }, select: { previewUrl: true }, take: 1 },
      },
    });
    return docs.map((doc) => ({
      id: doc.id,
      title: pickLocale(doc, "title", locale),
      cipher: doc.cipher,
      docType: doc.docType,
      yearLabel: doc.yearFrom ? String(doc.yearFrom) : null,
      placeName: doc.place ? pickLocale(doc.place, "name", locale) : null,
      accessStatus: doc.accessStatus,
      previewUrl: doc.accessStatus === "OPEN" ? (doc.files[0]?.previewUrl ?? null) : null,
      isDemo: doc.isDemo,
    }));
  } catch (error) {
    console.error("Не удалось загрузить документы для главной:", error);
    return [];
  }
}

async function getHomeData(locale: Locale) {
  try {
    const [news, exhibitions] = await Promise.all([
      db.news.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 3 }),
      db.exhibition.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, take: 3, include: { _count: { select: { exhibits: true } } } }),
    ]);
    return { news, exhibitions, locale };
  } catch (error) {
    console.error("Не удалось загрузить новости/выставки:", error);
    return { news: [], exhibitions: [], locale };
  }
}

// Цифры — с сайта архива, «Характеристика фондов» (на 01.01.2020)
const STATS = [
  { value: 1005, key: "statFunds" },
  { value: 610492, key: "statUnits" },
  { value: 7839, key: "statAv" },
] as const;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  const [t, tCommon, tNews, featured, branches, { news, exhibitions }] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Common" }),
    getTranslations({ locale, namespace: "News" }),
    getFeaturedDocuments(locale),
    getBranches(locale),
    getHomeData(locale),
  ]);
  const number = new Intl.NumberFormat(htmlLang[locale]);
  const branchCount = branches.filter((b) => !b.isMain).length;
  const date = new Intl.DateTimeFormat(htmlLang[locale], { day: "2-digit", month: "short" });

  const chips = [
    { label: t("chip1"), href: `/catalog?q=${encodeURIComponent(t("chip1"))}` },
    { label: t("chip2"), href: "/catalog?topic=war" },
    { label: t("chip3"), href: "/catalog?topic=virgin-lands" },
    { label: t("chip4"), href: "/branches" },
  ];
  const useful = [
    { n: "01", title: t("useful1Title"), text: t("useful1Text"), href: "/help#search", Icon: Search },
    { n: "02", title: t("useful2Title"), text: t("useful2Text"), href: "/help#structure", Icon: FolderTree },
    { n: "03", title: t("useful3Title"), text: t("useful3Text"), href: "/help#cipher", Icon: KeyRound, mono: true },
    { n: "04", title: t("useful4Title"), text: t("useful4Text"), href: "/help#access", Icon: BookOpenText },
  ];

  return (
    <>
      {/* ── Первый экран ── */}
      <section className="relative overflow-hidden text-[#FFF8EE]">
        <HeroIllustration />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,26,21,.15)_0%,rgba(30,26,21,.75)_78%)] dark:bg-[linear-gradient(180deg,rgba(10,9,7,.3)_0%,rgba(10,9,7,.85)_78%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-8 sm:pt-20 sm:pb-14">
          <p className="mb-4 text-xs tracking-[.2em] text-[#F3E9D6] uppercase sm:text-sm">{t("eyebrow")}</p>
          <h1 className="max-w-3xl font-serif text-[32px] leading-[1.1] font-bold sm:text-5xl lg:text-[56px]">{t("title")}</h1>
          <p className="mt-5 max-w-2xl text-base text-[#F3E9D6] sm:text-lg">{t("lead")}</p>

          <Form action={`/${locale}/catalog`} role="search" className="mt-8 flex max-w-3xl items-center gap-2 rounded-[16px] bg-surface p-2 text-ink shadow-[0_12px_40px_rgba(0,0,0,.25)]">
            <label htmlFor="home-ask" className="sr-only">
              {t("askLabel")}
            </label>
            <Search aria-hidden className="ml-2 size-5 shrink-0 text-muted-ink" />
            <input
              id="home-ask"
              name="q"
              type="search"
              required
              maxLength={200}
              placeholder={t("askPlaceholder")}
              className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-ink"
            />
            <span className="hidden items-center gap-1 rounded-md bg-accent-2-soft px-2 py-1 text-xs font-bold text-accent-2 sm:inline-flex">
              <Sparkles aria-hidden className="size-3" />
              {t("aiTag")}
            </span>
            <button type="submit" className="h-12 rounded-[12px] bg-primary px-5 font-bold text-primary-foreground hover:opacity-90">
              {t("askSubmit")}
            </button>
          </Form>

          <ul className="mt-5 flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <li key={chip.href} className={i >= 2 ? "hidden sm:block" : undefined}>
                <Link href={chip.href} className="inline-block rounded-full border border-white/35 bg-black/20 px-4 py-1.5 text-sm backdrop-blur-sm hover:bg-black/35">
                  {chip.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-right text-xs text-[#F3E9D6] italic opacity-80">{t("heroCaption")}</p>
        </div>
      </section>

      {/* ── Цифры ── */}
      <section aria-labelledby="stats-title" className="border-b border-border bg-surface">
        <h2 id="stats-title" className="sr-only">
          {t("statsTitle")}
        </h2>
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-8 lg:grid-cols-4">
          {[
            ...STATS.map((stat) => ({ key: stat.key, value: stat.value, label: t(stat.key) })),
            // Филиалы считаются по базе (все подразделения, кроме центрального здания)
            { key: "statBranches", value: branchCount, label: t("statBranches", { count: branchCount }) },
          ].map((stat, i) => (
            <div key={stat.key} className={`py-5 pl-4 ${i > 0 ? "lg:border-l" : ""} ${i % 2 ? "border-l lg:border-l" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""} border-border`}>
              <p className="font-serif text-2xl font-bold text-primary sm:text-[32px]">{number.format(stat.value)}</p>
              <p className="text-sm text-muted-ink">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-7xl px-4 pb-3 text-xs text-muted-ink sm:px-8">{t("statsNote")}</p>
      </section>

      {/* ── История в документах ── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-8 sm:pt-16">
          <SectionHeading title={t("featuredTitle")} subtitle={t("featuredSubtitle")} link={{ href: "/catalog", label: tCommon("allCatalog") }} />
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {featured.map((doc) => (
              <li key={doc.id} className="flex">
                <DocumentCard className="w-full" doc={doc} showDemo={isDemoMode} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Онлайн-выставки (появятся на этапе 5) ── */}
      {exhibitions.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-8 sm:pt-16">
          <SectionHeading title={t("exhibitionsTitle")} subtitle={t("exhibitionsSubtitle")} link={{ href: "/exhibitions", label: t("allExhibitions") }} />
          <ul className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            {exhibitions.map((exhibition, i) => (
              <li key={exhibition.id} className={i === 0 ? "lg:row-span-2" : undefined}>
                <Link href={`/exhibitions/${exhibition.slug}`} className="group relative flex h-full min-h-40 items-end overflow-hidden rounded-[16px] bg-[#4b3b29] p-5 text-[#FFF8EE]">
                  <span>
                    <span className="block text-xs tracking-[.12em] uppercase opacity-80">{pickLocale(exhibition, "periodLabel", locale)}</span>
                    <span className="mt-1 block font-serif text-xl font-bold group-hover:underline">{pickLocale(exhibition, "title", locale)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Филиалы + новости ── */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-2">
        <div>
          <SectionHeading title={t("branchesTitle")} subtitle={t("branchesSubtitle")} />
          <HomeBranches branches={branches} />
        </div>
        <div>
          <SectionHeading title={t("newsTitle")} link={{ href: "/news", label: t("allNews") }} />
          <ul className="divide-y divide-border">
            {news.map((item) => (
              <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                {item.publishedAt && (
                  <time
                    dateTime={item.publishedAt.toISOString()}
                    className="flex w-14 shrink-0 flex-col items-center rounded-[10px] border border-border bg-surface py-1.5 text-center"
                  >
                    <b className="font-serif text-xl leading-tight">{item.publishedAt.getDate()}</b>
                    <span className="text-xs text-muted-ink">{date.format(item.publishedAt).replace(/^\d+\s*/, "").replace(".", "")}</span>
                  </time>
                )}
                <div>
                  <h3 className="font-serif font-bold">
                    <Link href={`/news/${item.slug}`} className="hover:text-primary hover:underline">
                      {pickLocale(item, "title", locale)}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-ink">{pickLocale(item, "excerpt", locale)}</p>
                  <p className="mt-1 text-xs text-muted-ink">{tNews(`categories.${item.category}`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Соцсети архива (ТЗ §5.12) ── */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-8 sm:pt-16">
        <SectionHeading title={t("socialTitle")} subtitle={t("socialSubtitle")} />
        <ul className="flex flex-wrap gap-3">
          {socials.map((s) => (
            <li key={s.key}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-[14px] border border-border bg-surface px-5 py-3 hover:border-primary">
                <SocialIcon name={s.key} className="size-6 text-primary" />
                <span>
                  <b className="block">{s.label}</b>
                  <span className="text-sm text-muted-ink">{s.handle}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Полезная информация ── */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-8 sm:pt-16">
        <SectionHeading title={t("usefulTitle")} subtitle={t("usefulSubtitle")} />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {useful.map((card) => (
            <li key={card.n}>
              <Link href={card.href} className="group flex h-full flex-col rounded-[14px] border border-dashed border-border bg-surface p-5 hover:border-primary">
                <span className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-primary">{card.n}</span>
                  <card.Icon aria-hidden className="size-4 text-muted-ink" />
                </span>
                <span className="mt-2 font-serif text-lg font-bold group-hover:text-primary">{card.title}</span>
                <span className={`mt-1 text-sm text-muted-ink ${card.mono ? "font-mono" : ""}`}>{card.text}</span>
                <ArrowRight aria-hidden className="mt-auto size-4 self-end pt-2 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
