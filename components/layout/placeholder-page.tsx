// Страница-заготовка раздела (этап 2): хлебные крошки, заголовок, описание и
// «Раздел готовится». Нужна, чтобы навигация работала уже сейчас; содержимое
// разделов появится на следующих этапах.
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { PageKey } from "@/lib/site/page-metadata";
import { Breadcrumbs, type Crumb } from "@/components/archive/breadcrumbs";
import { EmptyState } from "@/components/archive/empty-state";
import { SectionHeading } from "@/components/archive/section-heading";

export async function PlaceholderPage({
  locale,
  pageKey,
  parents = [],
}: {
  locale: Locale;
  pageKey: PageKey;
  /** Родительские разделы для хлебных крошек, например [{ label: "Каталог", href: "/catalog" }] */
  parents?: Crumb[];
}) {
  const [tPages, tNav, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "Pages" }),
    getTranslations({ locale, namespace: "Nav" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <Breadcrumbs
        className="mb-6"
        items={[{ label: tNav("home"), href: "/" }, ...parents, { label: tPages(`${pageKey}.title`) }]}
      />
      <SectionHeading as="h1" title={tPages(`${pageKey}.title`)} subtitle={tPages(`${pageKey}.description`)} />
      <EmptyState
        title={tCommon("comingSoon")}
        text={tCommon("comingSoonText")}
        action={pageKey === "catalog" ? undefined : { href: "/catalog", label: tCommon("goToCatalog") }}
      />
    </div>
  );
}
