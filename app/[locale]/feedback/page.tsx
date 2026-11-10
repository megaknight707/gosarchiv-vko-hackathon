// Отзывы и предложения — единственная публичная форма сайта (не обращение и не заявление).
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/feedback">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "feedback", "/feedback");
}

export default async function FeedbackPage({ params }: PageProps<"/[locale]/feedback">) {
  const locale = (await params).locale as Locale;
  const [tNav, tPages] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("feedback.title") }]} />
      <SectionHeading as="h1" title={tPages("feedback.title")} subtitle={tPages("feedback.description")} />
      <FeedbackForm />
    </div>
  );
}
