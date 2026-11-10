// Филиалы и контакты (ТЗ §5.5): интерактивная карта, поиск, карточки и маршруты.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getBranches } from "@/lib/site/branches";
import { pageMetadata } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { BranchesExplorer } from "@/components/branches/branches-explorer";

export async function generateMetadata({ params }: PageProps<"/[locale]/branches">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "branches", "/branches");
}

export default async function BranchesPage({ params, searchParams }: PageProps<"/[locale]/branches">) {
  const locale = (await params).locale as Locale;
  const { b } = await searchParams;
  const [tNav, tPages, branches] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getBranches(locale),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("branches.title") }]} />
      <SectionHeading as="h1" title={tPages("branches.title")} subtitle={tPages("branches.description")} />
      <BranchesExplorer branches={branches} initialSlug={typeof b === "string" ? b : undefined} />
    </div>
  );
}
