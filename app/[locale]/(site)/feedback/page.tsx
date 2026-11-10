// Отзывы и предложения — единственная публичная форма сайта (не обращение и не заявление).
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
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
  const [tNav, tPages, t, format, published] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Feedback" }),
    getFormatter({ locale }),
    // Отзывы, которые сотрудники отметили «опубликовать на сайте». Без имени и почты автора.
    db.feedback
      .findMany({ where: { isPublished: true, kind: "REVIEW" }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, message: true, createdAt: true } })
      .catch(() => []),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-4" items={[{ label: tNav("home"), href: "/" }, { label: tPages("feedback.title") }]} />
      <SectionHeading as="h1" title={tPages("feedback.title")} subtitle={tPages("feedback.description")} />
      <FeedbackForm />
      {published.length > 0 && (
        <section aria-labelledby="published-reviews" className="mt-12">
          <h2 id="published-reviews" className="font-serif text-2xl font-bold">
            {t("publishedTitle")}
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {published.map((item) => (
              <li key={item.id} className="rounded-[14px] border border-border bg-surface p-5">
                <p className="whitespace-pre-line">{item.message}</p>
                <p className="mt-3 text-sm text-muted-ink">{format.dateTime(item.createdAt, { dateStyle: "long" })}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
