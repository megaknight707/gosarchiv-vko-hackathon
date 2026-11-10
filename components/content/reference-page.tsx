// Общий каркас справочных страниц раздела «Справка»: хлебные крошки Главная → Справка → страница,
// заголовок с описанием и дата сверки сведений с официальными источниками.
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import type { PageKey } from "@/lib/site/page-metadata";
import { VERIFIED_AT } from "@/lib/site/reference-content";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { SectionHeading } from "@/components/archive/section-heading";

export async function ReferencePage({ locale, pageKey, children }: { locale: Locale; pageKey: PageKey; children: ReactNode }) {
  const [tNav, tPages, t, format] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Services" }),
    getFormatter({ locale }),
  ]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs
        className="mb-4"
        items={[{ label: tNav("home"), href: "/" }, { label: tPages("help.title"), href: "/help" }, { label: tPages(`${pageKey}.title`) }]}
      />
      <SectionHeading as="h1" title={tPages(`${pageKey}.title`)} subtitle={tPages(`${pageKey}.description`)} />
      {children}
      <p className="mt-10 text-xs text-muted-ink">{t("verified", { date: format.dateTime(new Date(VERIFIED_AT), { dateStyle: "long" }) })}</p>
    </div>
  );
}
