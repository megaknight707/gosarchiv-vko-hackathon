// Создание записи в любом разделе универсального CRUD. Новая запись — всегда черновик.
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/require-role";
import { saveEntityAction } from "@/lib/admin/entity-actions";
import { getEntityConfig } from "@/lib/admin/entity-configs";
import { loadRelationOptions } from "@/lib/admin/entity-service";
import { toFormValues } from "@/lib/admin/form-values";
import { isDemoMode } from "@/lib/site/config";
import { AdminEntityForm } from "@/components/admin/admin-entity-form";
import { loose } from "@/lib/admin/loose-translator";

export default async function AdminEntityCreatePage({ params }: PageProps<"/[locale]/admin/[entity]/new">) {
  const { locale: rawLocale, entity } = await params;
  const locale = rawLocale as Locale;
  const config = getEntityConfig(entity);
  if (!config) notFound();
  const user = await requireAdminPage(locale, config.key, "create");
  const t = loose(await getTranslations({ locale, namespace: "Admin" }));
  const options = await loadRelationOptions(config, locale, user);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/admin/${config.key}`} className="text-sm text-muted-ink hover:text-ink">
        ← {t(`nav.${config.key}`)}
      </Link>
      <h1 className="font-serif text-2xl font-bold">{t("form.createTitle", { section: t(`nav.${config.key}`) })}</h1>
      {config.moderated && <p className="text-sm text-muted-ink">{t("form.draftHint")}</p>}
      <AdminEntityForm
        fields={config.fields}
        demoFlag={config.demoFlag}
        initial={toFormValues(config, null, { isDemo: isDemoMode })}
        options={options}
        action={saveEntityAction.bind(null, config.key, null, locale)}
        submitLabel={t("form.create")}
      />
    </div>
  );
}
