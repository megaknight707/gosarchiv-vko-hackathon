// Карточка архивного документа (ТЗ §5.3): все поля, шифр с копированием, просмотр
// цифровой копии (если документ открыт), условия доступа (если нет), «Поделиться»,
// «В избранное», связанные материалы. Хлебные крошки: Каталог / Фонд / Опись / Дело.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileLock2, FileText, Info, Languages } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { htmlLang, type Locale } from "@/i18n/routing";
import { getPublishedDocument, getRelatedDocuments, type PublishedDocument } from "@/lib/catalog/get-document";
import { knownValue } from "@/lib/archive/todo";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { isDemoMode, siteUrl } from "@/lib/site/config";
import { languageAlternates } from "@/lib/site/page-metadata";
import { AccessStamp } from "@/components/archive/access-stamp";
import { ArchiveCipher } from "@/components/archive/archive-cipher";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { DocumentCard } from "@/components/archive/document-card";
import { SectionHeading } from "@/components/archive/section-heading";
import { AiSummary } from "@/components/document/ai-summary";
import { DocumentActions } from "@/components/document/document-actions";
import { DocumentViewer } from "@/components/document/document-viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/catalog/[id]">): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale as Locale;
  const doc = await getPublishedDocument(id);
  if (!doc) return {};
  const title = pickLocale(doc, "title", locale);
  const description = pickLocale(doc, "summary", locale).slice(0, 200);
  const preview = doc.accessStatus === "OPEN" ? doc.files[0]?.previewUrl : null;
  return {
    title: `${title} · ${doc.cipher}`,
    description,
    alternates: { canonical: `/${locale}/catalog/${id}`, languages: languageAlternates(`/catalog/${id}`) },
    openGraph: { title, description, type: "article", images: preview ? [{ url: preview }] : undefined },
    // Документы с ограниченным доступом не индексируются (ТЗ §7.5)
    robots: doc.accessStatus === "RESTRICTED" ? { index: false, follow: true } : undefined,
  };
}

function formatPeriod(doc: PublishedDocument, locale: Locale): string | null {
  if (doc.dateExact) {
    return new Intl.DateTimeFormat(htmlLang[locale], { day: "numeric", month: "long", year: "numeric" }).format(doc.dateExact);
  }
  const years = doc.yearFrom && doc.yearTo && doc.yearFrom !== doc.yearTo ? `${doc.yearFrom}–${doc.yearTo}` : (doc.yearFrom ?? doc.yearTo)?.toString();
  const label = pickLocale(doc, "periodLabel", locale);
  return [years, label && `(${label})`].filter(Boolean).join(" ") || null;
}

export default async function DocumentPage({ params }: PageProps<"/[locale]/catalog/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = rawLocale as Locale;
  const doc = await getPublishedDocument(id);
  if (!doc) notFound();

  const [t, tNav, tArchive, tCatalog, tDemo, related] = await Promise.all([
    getTranslations({ locale, namespace: "Document" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Archive" }),
    getTranslations({ locale, namespace: "Catalog" }),
    getTranslations({ locale, namespace: "Demo" }),
    getRelatedDocuments(doc),
  ]);

  const unit = doc.storageUnit;
  const inventory = unit.inventory;
  const fund = inventory.fund;
  const title = pickLocale(doc, "title", locale);
  const suffix = locale === "kz" ? "Kz" : "En";
  const translationMissing = locale !== "ru" && (!doc[`title${suffix}`]?.trim() || (Boolean(doc.summaryRu) && !doc[`summary${suffix}`]?.trim()));
  // Сканы-изображения листаются в просмотрщике, PDF-копии (загруженные в админке) — ссылками
  const imagePages = doc.files.filter((f) => f.kind === "IMAGE");
  const pdfFiles = doc.files.filter((f) => f.kind === "PDF");
  const canShowCopy = doc.accessStatus === "OPEN" && doc.hasDigitalCopy && doc.files.length > 0;
  const languages = (doc.language ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => (["ru", "kk", "en"].includes(code) ? t(`languages.${code as "ru" | "kk" | "en"}`) : code));
  const storage = doc.branch
    ? [pickLocale(doc.branch, "name", locale), knownValue(pickLocale(doc.branch, "address", locale))].filter(Boolean).join(", ")
    : null;
  const pageUrl = `${siteUrl}/${locale}/catalog/${doc.id}`;

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: t("fund"),
      value: (
        <Link href={`/catalog?view=funds&fund=${encodeURIComponent(fund.number)}`} className="hover:text-primary hover:underline">
          <span className="font-mono">№ {fund.number}</span> · {pickLocale(fund, "title", locale)}
        </Link>
      ),
    },
    { label: t("inventory"), value: <span className="font-mono">№ {inventory.number}</span> },
    { label: t("unit"), value: <span className="font-mono">№ {unit.number}</span> },
    { label: t("date"), value: formatPeriod(doc, locale) },
    { label: t("docType"), value: tArchive(`docType.${doc.docType}`) },
    { label: t("language"), value: languages.join(", ") || null },
    { label: t("sheets"), value: doc.sheetsCount },
    { label: t("place"), value: doc.place ? pickLocale(doc.place, "name", locale) : null },
    { label: t("author"), value: doc.author },
    { label: t("storage"), value: storage },
    {
      label: t("topics"),
      value: doc.tags.length ? (
        <span className="flex flex-wrap gap-1.5">
          {doc.tags.map((tag) => (
            <Link key={tag.id} href={`/catalog?topic=${tag.slug}`} className="rounded-md bg-chip px-2 py-0.5 text-sm hover:text-primary">
              {pickLocale(tag, "name", locale)}
            </Link>
          ))}
        </span>
      ) : null,
    },
    { label: t("access"), value: tArchive(`access.${doc.accessStatus}`) },
    { label: t("digitalCopy"), value: canShowCopy ? t("yes") : t("no") },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["ArchiveComponent", "CreativeWork"],
    name: title,
    identifier: doc.cipher,
    description: pickLocale(doc, "summary", locale),
    dateCreated: doc.yearFrom ? String(doc.yearFrom) : undefined,
    inLanguage: doc.language ?? undefined,
    url: pageUrl,
    image: canShowCopy ? doc.files[0]?.previewUrl : undefined,
    holdingArchive: { "@type": "ArchiveOrganization", name: doc.branch ? pickLocale(doc.branch, "name", locale) : undefined },
    isPartOf: { "@type": "Collection", name: pickLocale(fund, "title", locale), identifier: `Ф. ${fund.number}` },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Breadcrumbs
        className="mb-6"
        items={[
          { label: tNav("catalog"), href: "/catalog" },
          { label: tCatalog("fundN", { number: fund.number }), href: `/catalog?view=funds&fund=${encodeURIComponent(fund.number)}` },
          { label: tCatalog("inventoryN", { number: inventory.number }), href: `/catalog?view=funds&fund=${encodeURIComponent(fund.number)}` },
          { label: tCatalog("unitN", { number: unit.number }) },
        ]}
      />

      {doc.isDemo && isDemoMode && (
        <p role="note" className="mb-5 flex items-start gap-2 rounded-[12px] border border-dashed border-accent-2 bg-accent-2-soft px-4 py-3 text-sm">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-2" />
          <span>
            <b>{tDemo("record")}.</b> {t("demoNotice")}
          </span>
        </p>
      )}

      {/* Дополнения к ТЗ §3.3: нет проверенного перевода — показываем оригинал и честно об этом говорим */}
      {translationMissing && (
        <p role="note" lang={htmlLang[locale]} className="mb-5 flex items-start gap-2 rounded-[12px] border border-border bg-chip px-4 py-3 text-sm">
          <Languages aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-ink" />
          <span>{t("translationMissing")}</span>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        {/* Левая колонка: просмотр копии или условия доступа */}
        <div className="lg:sticky lg:top-4">
          {canShowCopy ? (
            <div className="space-y-3">
              {imagePages.length > 0 && (
                <DocumentViewer
                  title={title}
                  pages={imagePages.map((f) => ({ url: f.url, previewUrl: f.previewUrl, width: f.width, height: f.height }))}
                />
              )}
              {pdfFiles.map((f, i) => (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-[14px] border border-border bg-surface p-4 font-bold hover:bg-chip"
                >
                  <FileText aria-hidden className="size-6 text-accent-2" />
                  {t("pdfCopy", { number: i + 1 })}
                </a>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[18px] border border-border bg-chip p-8 text-center">
              <span className="mb-4 grid size-16 place-items-center rounded-full bg-surface text-lock">
                <FileLock2 aria-hidden className="size-7" />
              </span>
              <h2 className="font-serif text-xl font-bold">{t("noCopyTitle")}</h2>
              <p className="mt-3 max-w-md text-muted-ink">
                {doc.accessStatus === "RESTRICTED"
                  ? t("noCopyRestricted")
                  : doc.accessStatus === "DESCRIPTION_ONLY"
                    ? t("noCopyDescriptionOnly")
                    : t("noCopyOpen")}
              </p>
              <Link href="/help" className="mt-5 font-bold text-primary underline-offset-4 hover:underline">
                {t("howAccess")} →
              </Link>
            </div>
          )}
        </div>

        {/* Правая колонка: паспорт документа */}
        <article className="rounded-[18px] border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(60,40,20,.06),0_8px_24px_rgba(60,40,20,.06)] sm:p-7">
          <AccessStamp status={doc.accessStatus} />
          <h1 className="mt-3 font-serif text-2xl leading-tight font-bold sm:text-[32px]">{title}</h1>

          <div className="mt-4 rounded-[12px] bg-chip px-4 py-3">
            <ArchiveCipher cipher={doc.cipher} className="[&_code]:text-base [&_code]:text-ink" />
          </div>

          <h2 className="sr-only">{t("fields")}</h2>
          <dl className="mt-5 grid grid-cols-[minmax(0,10rem)_1fr] gap-x-4 gap-y-2.5 text-[15px]">
            {rows
              .filter((row) => row.value !== null && row.value !== undefined && row.value !== "")
              .map((row) => (
                <div key={row.label} className="contents">
                  <dt className="text-muted-ink">{row.label}</dt>
                  <dd className="min-w-0 break-words">{row.value}</dd>
                </div>
              ))}
          </dl>

          {pickLocale(doc, "summary", locale) && (
            <section className="mt-6 border-t border-border pt-5">
              <h2 className="font-serif text-lg font-bold">{t("summary")}</h2>
              <p className="mt-2 leading-relaxed">{pickLocale(doc, "summary", locale)}</p>
            </section>
          )}
          {pickLocale(doc, "historicalNote", locale) && (
            <section className="mt-5">
              <h2 className="font-serif text-lg font-bold">{t("historicalNote")}</h2>
              <p className="mt-2 leading-relaxed text-muted-ink">{pickLocale(doc, "historicalNote", locale)}</p>
            </section>
          )}

          <AiSummary id={doc.id} />

          <div className="mt-6 border-t border-border pt-5">
            <DocumentActions id={doc.id} title={title} url={pageUrl} />
          </div>
        </article>
      </div>

      {related.length > 0 && (
        <section id="related" className="mt-14 scroll-mt-6" aria-labelledby="related-title">
          <SectionHeading title={t("related")} subtitle={t("relatedSubtitle")} />
          <h2 id="related-title" className="sr-only">
            {t("related")}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
            {related.map((item) => (
              <li key={item.id} className="flex">
                <DocumentCard
                  className="w-full"
                  doc={{
                    id: item.id,
                    title: pickLocale(item, "title", locale),
                    cipher: item.cipher,
                    docType: item.docType,
                    yearLabel: item.yearFrom ? String(item.yearFrom) : null,
                    placeName: item.place ? pickLocale(item.place, "name", locale) : null,
                    accessStatus: item.accessStatus,
                    previewUrl: item.accessStatus === "OPEN" ? (item.files[0]?.previewUrl ?? null) : null,
                    isDemo: item.isDemo,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
