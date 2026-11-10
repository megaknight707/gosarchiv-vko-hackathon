// Вопросы и ответы об использовании сайта (не про услуги). Разметка FAQPage для поисковиков.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/site/page-metadata";
import { getFaq } from "@/lib/site/pages";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";
import { FaqAccordion } from "@/components/help/faq-accordion";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "faq", "/faq");
}

export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  const locale = (await params).locale as Locale;
  const [tNav, tPages, items] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getFaq(locale),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("faq.title") }]} />
      <SectionHeading as="h1" title={tPages("faq.title")} subtitle={tPages("faq.description")} />
      <FaqAccordion items={items} />
    </div>
  );
}
