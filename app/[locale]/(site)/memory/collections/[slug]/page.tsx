// Тематическая коллекция «Архива памяти»: описание, период, источник и документы коллекции.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { getCollection } from "@/lib/memory/memory";
import { isDemoMode } from "@/lib/site/config";
import { languageAlternates } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { DocumentCard } from "@/components/archive/document-card";
import { EmptyState } from "@/components/archive/empty-state";
import { SectionHeading } from "@/components/archive/section-heading";

export async function generateMetadata({ params }: PageProps<"/[locale]/memory/collections/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = await getCollection(slug);
  if (!c) return {};
  return {
    title: pickLocale(c, "title", locale as Locale),
    description: pickLocale(c, "description", locale as Locale),
    alternates: { canonical: `/${locale}/memory/collections/${slug}`, languages: languageAlternates(`/memory/collections/${slug}`) },
  };
}

export default async function CollectionPage({ params }: PageProps<"/[locale]/memory/collections/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const collection = await getCollection(slug);
  if (!collection) notFound();
  const [t, tNav, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "Memory" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  const title = pickLocale(collection, "title", locale);
  const period = pickLocale(collection, "periodLabel", locale);
  const source = pickLocale(collection, "sourceNote", locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tNav("memory"), href: "/memory" }, { label: title }]} />
      <SectionHeading as="h1" title={title} subtitle={pickLocale(collection, "description", locale)} />
      <p className="-mt-3 mb-6 flex flex-wrap gap-x-4 text-sm text-muted-ink">
        {period && <span>{period}</span>}
        <span>{t("materials", { count: collection.documents.length })}</span>
        {source && <span>{t("source")}: {source}</span>}
      </p>
      {collection.documents.length === 0 ? (
        <EmptyState title={t("preparing")} action={{ href: "/catalog", label: tCommon("goToCatalog") }} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {collection.documents.map((doc) => (
            <li key={doc.id} className="flex">
              <DocumentCard
                className="w-full"
                showDemo={isDemoMode}
                doc={{
                  id: doc.id,
                  title: pickLocale(doc, "title", locale),
                  cipher: doc.cipher,
                  docType: doc.docType,
                  yearLabel: doc.yearFrom ? String(doc.yearFrom) : null,
                  placeName: doc.place ? pickLocale(doc.place, "name", locale) : null,
                  accessStatus: doc.accessStatus,
                  previewUrl: doc.accessStatus === "OPEN" ? (doc.files[0]?.previewUrl ?? null) : null,
                  isDemo: doc.isDemo,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
