// Главная — временная версия этапа 2: первый экран и «История в документах»
// (проверка базовых компонентов на реальных данных). Полная главная — этап 4.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { isDemoMode } from "@/lib/site/config";
import { languageAlternates } from "@/lib/site/page-metadata";
import { DocumentCard, type DocumentCardData } from "@/components/archive/document-card";
import { SectionHeading } from "@/components/archive/section-heading";

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

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const [t, tCommon, featured] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Common" }),
    getFeaturedDocuments(locale),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-[#3b3127] text-[#FFF8EE]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-90"
          style={{ background: "linear-gradient(180deg, #b8a37f 0%, #6f5d45 55%, #2c241c 100%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24">
          <p className="mb-4 text-xs tracking-[.2em] text-[#F3E9D6] uppercase sm:text-sm">{t("eyebrow")}</p>
          <h1 className="max-w-3xl font-serif text-[32px] leading-tight font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mt-5 max-w-2xl text-base text-[#F3E9D6] sm:text-lg">{t("lead")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-8 sm:pt-16">
        <SectionHeading
          title={t("featuredTitle")}
          subtitle={t("featuredSubtitle")}
          link={{ href: "/catalog", label: tCommon("allCatalog") }}
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {featured.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} showDemo={isDemoMode} />
          ))}
        </div>
      </section>
    </>
  );
}
