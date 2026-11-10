// Карточка записи в админке: форма, согласование (статус, переходы, история комментариев),
// для документа — цифровые копии и подсказка «Возможный дубликат».
import { ExternalLink } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { can, canOnRecord } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import type { PublicationStatus } from "@/lib/generated/prisma/client";
import { deleteEntityAction, saveEntityAction, transitionAction } from "@/lib/admin/entity-actions";
import { getEntityConfig } from "@/lib/admin/entity-configs";
import { findPossibleDuplicates, getEntityRecord, loadRelationOptions, recordTitle } from "@/lib/admin/entity-service";
import { toFormValues } from "@/lib/admin/form-values";
import { availableTransitions } from "@/lib/admin/moderation";
import { isDemoMode } from "@/lib/site/config";
import { AdminEntityForm } from "@/components/admin/admin-entity-form";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DeleteButton } from "@/components/admin/delete-button";
import { DocumentFilesManager } from "@/components/admin/document-files-manager";
import { ModerationPanel } from "@/components/admin/moderation-panel";
import { StatusBadge } from "@/components/admin/status-badge";
import { loose } from "@/lib/admin/loose-translator";

export default async function AdminEntityEditPage({ params, searchParams }: PageProps<"/[locale]/admin/[entity]/[id]">) {
  const { locale: rawLocale, entity, id } = await params;
  const locale = rawLocale as Locale;
  const config = getEntityConfig(entity);
  if (!config || !/^[a-z0-9]{8,40}$/i.test(id)) notFound();
  const user = await requireAdminPage(locale, config.key);
  const record = await getEntityRecord(config, id);
  if (!record) notFound();
  // Администратор филиала не откроет чужой филиал даже по прямой ссылке
  if (!canOnRecord(user, config.key, "view", record)) redirect(`/${locale}/admin/forbidden`);

  const search = await searchParams;
  const t = loose(await getTranslations({ locale, namespace: "Admin" }));
  const format = await getFormatter({ locale });
  const canEdit = canOnRecord(user, config.key, "edit", record);
  const canDelete = canOnRecord(user, config.key, "delete", record);
  const status = record.status as PublicationStatus | undefined;
  const title = recordTitle(config, record, locale);

  const [options, history, files, duplicates] = await Promise.all([
    loadRelationOptions(config, locale, user),
    config.moderated
      ? db.moderationComment.findMany({ where: { entityType: config.key, entityId: id }, include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 })
      : [],
    config.key === "documents" ? db.digitalFile.findMany({ where: { documentId: id }, orderBy: { pageNumber: "asc" } }) : [],
    config.key === "documents" ? findPossibleDuplicates(id, String(record.titleRu ?? "")) : [],
  ]);

  const transitions = status ? availableTransitions(status, (action) => canOnRecord(user, config.key, action, { ...record, status: undefined })) : [];
  const publicPath = status === "PUBLISHED" || !config.moderated ? config.publicPath?.(record) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href={`/admin/${config.key}`} className="text-sm text-muted-ink hover:text-ink">
        ← {t(`nav.${config.key}`)}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold break-words">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {status && <StatusBadge status={status} />}
            {typeof record.cipher === "string" && <span className="font-mono text-xs text-muted-ink">{record.cipher}</span>}
            {record.isDemo === true && <span className="rounded bg-lock-soft px-1.5 text-xs font-bold text-lock uppercase">{t("demo")}</span>}
          </div>
        </div>
        {publicPath && (
          <Link href={publicPath} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-2 hover:underline">
            <ExternalLink aria-hidden className="size-4" />
            {t("form.openOnSite")}
          </Link>
        )}
      </div>

      {search.created && <AdminNotice tone="ok">{t("notices.created")}</AdminNotice>}
      {search.deleteError === "children" && <AdminNotice tone="error">{t("notices.deleteChildren")}</AdminNotice>}
      {!canEdit && can(user, config.key, "edit") && <AdminNotice tone="info">{t("notices.lockedForEdit")}</AdminNotice>}
      {duplicates.length > 0 && (
        <AdminNotice tone="warn">
          {t("form.duplicates")}{" "}
          {duplicates.map((d, i) => (
            <span key={d.id}>
              {i > 0 && ", "}
              <Link href={`/admin/documents/${d.id}`} className="underline">
                {d.cipher} — {d.titleRu}
              </Link>
            </span>
          ))}
        </AdminNotice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-8">
          <AdminEntityForm
            fields={config.fields}
            demoFlag={config.demoFlag}
            initial={toFormValues(config, record, { isDemo: isDemoMode })}
            options={options}
            action={saveEntityAction.bind(null, config.key, id, locale)}
            readOnly={!canEdit}
          />
          {config.key === "documents" && (
            <DocumentFilesManager
              documentId={id}
              canEdit={canEdit}
              files={files.map((f) => ({ id: f.id, kind: f.kind, url: f.url, previewUrl: f.previewUrl, pageNumber: f.pageNumber, sizeBytes: f.sizeBytes }))}
            />
          )}
        </div>

        <aside className="space-y-5">
          {status && (
            <section className="rounded-[12px] border border-border bg-surface p-4">
              <h2 className="font-serif text-lg font-bold">{t("moderation.title")}</h2>
              <p className="mt-1 text-sm text-muted-ink">{t(`moderation.hint.${status}`)}</p>
              <ModerationPanel action={transitionAction.bind(null, config.key, id)} transitions={transitions} />
            </section>
          )}
          {config.moderated && (
            <section className="rounded-[12px] border border-border bg-surface p-4">
              <h2 className="font-serif text-lg font-bold">{t("moderation.history")}</h2>
              {history.length === 0 ? (
                <p className="mt-2 text-sm text-muted-ink">{t("moderation.noHistory")}</p>
              ) : (
                <ol className="mt-3 space-y-3 text-sm">
                  {history.map((item) => (
                    <li key={item.id} className="border-l-2 border-border pl-3">
                      <p className="flex flex-wrap items-center gap-1">
                        {item.toStatus && <StatusBadge status={item.toStatus} />}
                      </p>
                      <p className="mt-1 text-xs text-muted-ink">
                        {item.author?.name ?? t("audit.deletedUser")} · {format.dateTime(item.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      {item.text && <p className="mt-1 rounded bg-chip px-2 py-1 whitespace-pre-line">{item.text}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
          <section className="rounded-[12px] border border-border bg-surface p-4 text-xs text-muted-ink">
            {record.createdAt instanceof Date && (
              <p>
                {t("fields.createdAt")}: {format.dateTime(record.createdAt, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
            {record.updatedAt instanceof Date && (
              <p>
                {t("fields.updatedAt")}: {format.dateTime(record.updatedAt, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
            {can(user, "audit", "view") && (
              <Link href={`/admin/audit?entity=${config.key}&entityId=${id}`} className="mt-2 inline-block font-bold text-accent-2 hover:underline">
                {t("audit.forRecord")}
              </Link>
            )}
          </section>
          {canDelete && <DeleteButton action={deleteEntityAction.bind(null, config.key, id, locale)} />}
        </aside>
      </div>
    </div>
  );
}
