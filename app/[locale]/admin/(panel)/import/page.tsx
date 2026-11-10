// Импорт документов из CSV: шаблон, описание колонок, мастер проверки и загрузки.
import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/require-role";
import { IMPORT_COLUMNS } from "@/lib/admin/document-import";
import { isDemoMode } from "@/lib/site/config";
import { ImportWizard } from "@/components/admin/import-wizard";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/import">) {
  const t = await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.nav" });
  return { title: t("import") };
}

export default async function AdminImportPage({ params }: PageProps<"/[locale]/admin/import">) {
  const locale = (await params).locale as Locale;
  await requireAdminPage(locale, "import", "create");
  const t = await getTranslations({ locale, namespace: "Admin.import" });

  return (
    <div className="max-w-5xl space-y-5">
      <h1 className="font-serif text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-ink">{t("intro")}</p>
      <div className="rounded-[12px] border border-border bg-surface p-4 text-sm">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- скачивание CSV-файла, а не переход на страницу */}
        <a href="/api/admin/export?entity=import-template" className="inline-flex items-center gap-1.5 font-bold text-accent-2 hover:underline">
          <Download aria-hidden className="size-4" />
          {t("template")}
        </a>
        <p className="mt-2 text-muted-ink">{t("columnsHint")}</p>
        <p className="mt-1 font-mono text-xs break-words">{IMPORT_COLUMNS.join(" ; ")}</p>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-muted-ink">
          <li>{t("rules.required")}</li>
          <li>{t("rules.docType")}</li>
          <li>{t("rules.access")}</li>
          <li>{t("rules.fund")}</li>
          <li>{t("rules.drafts")}</li>
        </ul>
      </div>
      <ImportWizard demoDefault={isDemoMode} />
    </div>
  );
}
