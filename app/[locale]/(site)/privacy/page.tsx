// Политика конфиденциальности — коротко и честно; текст из таблицы Page (редактируется в админке).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { getPageSections } from "@/lib/site/pages";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { ContentBody } from "@/components/content/content-body";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "privacy", "/privacy");
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const locale = (await params).locale as Locale;
  const [tNav, tPages, sections] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getPageSections("privacy", locale),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("privacy.title") }]} />
      <SectionHeading as="h1" title={tPages("privacy.title")} />
      <ContentBody body={sections[0]?.body} className="max-w-3xl" />
    </div>
  );
}
