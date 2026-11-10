// Хронология (ТЗ §8.2): история архива и вехи региона, фильтр по теме, переход в каталог.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getTimeline } from "@/lib/memory/memory";
import { pageMetadata } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { TimelineView } from "@/components/memory/timeline-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/memory/timeline">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "timeline", "/memory/timeline");
}

export default async function TimelinePage({ params }: PageProps<"/[locale]/memory/timeline">) {
  const locale = (await params).locale as Locale;
  const [tNav, tPages, events] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTimeline(locale),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tNav("memory"), href: "/memory" }, { label: tPages("timeline.title") }]} />
      <SectionHeading as="h1" title={tPages("timeline.title")} subtitle={tPages("timeline.description")} />
      <TimelineView events={events} />
    </div>
  );
}
