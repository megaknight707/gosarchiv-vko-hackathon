// Список записей любого раздела универсального CRUD: /admin/documents, /admin/news, …
import { Download } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/require-role";
import { getEntityConfig } from "@/lib/admin/entity-configs";
import { listEntities } from "@/lib/admin/entity-service";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminNotice } from "@/components/admin/admin-notice";
import { loose } from "@/lib/admin/loose-translator";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/[entity]">) {
  const { locale, entity } = await params;
  const t = loose(await getTranslations({ locale: locale as Locale, namespace: "Admin.nav" }));
  return { title: getEntityConfig(entity) ? t(entity) : undefined };
}

export default async function AdminEntityListPage({ params, searchParams }: PageProps<"/[locale]/admin/[entity]">) {
  const { locale: rawLocale, entity } = await params;
  const locale = rawLocale as Locale;
  const config = getEntityConfig(entity);
  if (!config) notFound();
  const user = await requireAdminPage(locale, config.key);
  const search = await searchParams;
  const one = (key: string) => (typeof search[key] === "string" ? (search[key] as string) : undefined);
  const listParams = { q: one("q"), status: one("status"), sort: one("sort"), dir: one("dir"), page: Number(one("page")) || 1 };
  const list = await listEntities(config, user, listParams);
  const t = loose(await getTranslations({ locale, namespace: "Admin" }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">{t(`nav.${config.key}`)}</h1>
        <a href={`/api/admin/export?entity=${config.key}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-2 hover:underline">
          <Download aria-hidden className="size-4" />
          {t("table.exportCsv")}
        </a>
      </div>
      {one("deleted") && <AdminNotice tone="ok">{t("notices.deleted")}</AdminNotice>}
      {one("bulk") && one("bulk") !== "none" && (
        <AdminNotice tone={Number(one("skipped")) > 0 ? "warn" : "ok"}>
          {t("notices.bulk", { done: Number(one("done")) || 0, skipped: Number(one("skipped")) || 0 })}
        </AdminNotice>
      )}
      {config.key === "documents" && can(user, "import", "create") && (
        <p className="text-sm text-muted-ink">{t("table.importHint")}</p>
      )}
      <AdminDataTable config={config} user={user} locale={locale} params={listParams} {...list} />
    </div>
  );
}
