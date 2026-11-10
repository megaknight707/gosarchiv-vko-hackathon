// «Об архиве» (ТЗ §5.2): история, направления, миссия, руководство, структура,
// нормативная база, комплаенс-служба, отчёты, фотогалерея, филиалы. Тексты — из таблицы Page (админка).
import type { Metadata } from "next";
import { MapPinned } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { getPageSections } from "@/lib/site/pages";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { ContentBody } from "@/components/content/content-body";
import { ComplianceDocuments } from "@/components/content/compliance-documents";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "about", "/about");
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const locale = (await params).locale as Locale;
  const [tNav, tPages, tContent, tAbout, sections] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Content" }),
    getTranslations({ locale, namespace: "About" }),
    getPageSections("about", locale),
  ]);
  const anchors = [...sections.map((s) => ({ id: s.slug, title: s.title })), { id: "branches", title: tAbout("branchesTitle") }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("about.title") }]} />
      <SectionHeading as="h1" title={tPages("about.title")} subtitle={tPages("about.description")} />

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav aria-label={tContent("sections")} className="lg:sticky lg:top-4 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible">
            {anchors.map((anchor) => (
              <li key={anchor.id} className="shrink-0">
                <a href={`#${anchor.id}`} className="block rounded-full border border-border bg-surface px-3 py-1.5 text-sm whitespace-nowrap hover:border-primary lg:rounded-md lg:border-0 lg:bg-transparent lg:px-2 lg:hover:bg-chip">
                  {anchor.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-10">
          {sections.map((section) => (
            <section key={section.slug} id={section.slug} aria-labelledby={`${section.slug}-title`} className="scroll-mt-6">
              <h2 id={`${section.slug}-title`} className="mb-4 font-serif text-2xl font-bold">
                {section.title}
              </h2>
              <ContentBody body={section.body} className="max-w-3xl" />
              {section.slug === "about-compliance" && <ComplianceDocuments locale={locale} />}
            </section>
          ))}
          <section id="branches" aria-labelledby="branches-title" className="scroll-mt-6">
            <h2 id="branches-title" className="mb-4 font-serif text-2xl font-bold">
              {tAbout("branchesTitle")}
            </h2>
            <div className="flex flex-col items-start gap-4 rounded-[14px] border border-border bg-surface p-5 sm:flex-row sm:items-center">
              <MapPinned aria-hidden className="size-8 shrink-0 text-accent-2" />
              <p className="flex-1 text-muted-ink">{tAbout("branchesText")}</p>
              <Link href="/branches" className="rounded-[10px] bg-primary px-4 py-2.5 font-bold text-primary-foreground hover:opacity-90">
                {tAbout("openBranches")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
