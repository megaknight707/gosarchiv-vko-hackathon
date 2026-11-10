// Журнал действий (ТЗ §6.8): дата, время, пользователь и описание действия.
// Фильтры по пользователю, действию, разделу и периоду — в адресе страницы.
import { getFormatter, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/require-role";
import { AUDIT_ACTIONS } from "@/lib/admin/audit-log";
import { getEntityConfig } from "@/lib/admin/entity-configs";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { loose } from "@/lib/admin/loose-translator";

const PAGE_SIZE = 50;
// Операции, завершившиеся отказом (для колонки «Результат»)
const FAILED = ["login_failed", "login_locked"];

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/audit">) {
  const t = loose(await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.nav" }));
  return { title: t("audit") };
}

function describe(details: unknown, status: (code: string) => string): string {
  if (!details || typeof details !== "object") return "";
  const d = details as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof d.title === "string") parts.push(`«${d.title}»`);
  if (typeof d.from === "string" && typeof d.to === "string") parts.push(`${status(d.from)} → ${status(d.to)}`);
  if (d.changes && typeof d.changes === "object") {
    const fields = Object.keys(d.changes as object);
    if (fields.length) parts.push(fields.slice(0, 8).join(", ") + (fields.length > 8 ? "…" : ""));
  }
  if (typeof d.comment === "string") parts.push(`💬 ${d.comment}`);
  if (typeof d.email === "string") parts.push(d.email);
  if (typeof d.imported === "number") parts.push(`+${d.imported}`);
  if (typeof d.file === "string") parts.push(d.file);
  if (typeof d.reason === "string") parts.push(d.reason);
  return parts.join(" · ");
}

export default async function AdminAuditPage({ params, searchParams }: PageProps<"/[locale]/admin/audit">) {
  const locale = (await params).locale as Locale;
  await requireAdminPage(locale, "audit");
  const search = await searchParams;
  const one = (key: string) => (typeof search[key] === "string" ? (search[key] as string).slice(0, 60) : "");
  const filters = { user: one("user"), action: one("action"), entity: one("entity"), entityId: one("entityId"), from: one("from"), to: one("to") };
  const page = Math.max(1, Number(one("page")) || 1);

  const where: Prisma.AuditLogWhereInput = {};
  if (filters.user) where.userId = filters.user;
  if (filters.action && (AUDIT_ACTIONS as string[]).includes(filters.action)) where.action = filters.action;
  if (filters.entity) where.entityType = filters.entity;
  if (filters.entityId) where.entityId = filters.entityId;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(filters.from) ? new Date(`${filters.from}T00:00:00+05:00`) : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(filters.to) ? new Date(`${filters.to}T23:59:59+05:00`) : null;
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

  const [t, format, users, rows, total] = await Promise.all([
    getTranslations({ locale, namespace: "Admin" }).then(loose),
    getFormatter({ locale }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.auditLog.findMany({ where, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.auditLog.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => `/admin/audit?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page: String(p) })}`;

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl font-bold">{t("nav.audit")}</h1>
      <form method="get" action={`/${locale}/admin/audit`} className="flex flex-wrap items-end gap-2 text-sm">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted-ink">{t("audit.user")}</span>
          <select name="user" defaultValue={filters.user} className="admin-input">
            <option value="">{t("audit.all")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted-ink">{t("audit.action")}</span>
          <select name="action" defaultValue={filters.action} className="admin-input">
            <option value="">{t("audit.all")}</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {t(`audit.actions.${action}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted-ink">{t("audit.from")}</span>
          <input type="date" name="from" defaultValue={filters.from} className="admin-input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted-ink">{t("audit.to")}</span>
          <input type="date" name="to" defaultValue={filters.to} className="admin-input" />
        </label>
        {filters.entity && <input type="hidden" name="entity" value={filters.entity} />}
        {filters.entityId && <input type="hidden" name="entityId" value={filters.entityId} />}
        <button type="submit" className="rounded-[10px] border border-border bg-surface px-3 py-2 font-bold hover:bg-chip">
          {t("table.apply")}
        </button>
        {Object.values(filters).some(Boolean) && (
          <Link href="/admin/audit" className="px-2 py-2 text-primary underline">
            {t("table.reset")}
          </Link>
        )}
      </form>
      <p className="text-sm text-muted-ink">{t("table.found", { count: total })}</p>

      <div className="overflow-x-auto rounded-[12px] border border-border bg-surface">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border bg-chip/60 text-left">
            <tr>
              <th scope="col" className="px-3 py-2">{t("audit.when")}</th>
              <th scope="col" className="px-3 py-2">{t("audit.user")}</th>
              <th scope="col" className="px-3 py-2">{t("audit.action")}</th>
              <th scope="col" className="px-3 py-2">{t("audit.section")}</th>
              <th scope="col" className="px-3 py-2">{t("audit.objectId")}</th>
              <th scope="col" className="px-3 py-2">{t("audit.result")}</th>
              <th scope="col" className="px-3 py-2">{t("audit.details")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const config = row.entityType ? getEntityConfig(row.entityType) : undefined;
              return (
                <tr key={row.id} className="border-b border-border align-top last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">{format.dateTime(row.createdAt, { dateStyle: "short", timeStyle: "medium" })}</td>
                  <td className="px-3 py-2">{row.user?.name ?? t("audit.anonymous")}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{(AUDIT_ACTIONS as string[]).includes(row.action) ? t(`audit.actions.${row.action}`) : row.action}</td>
                  <td className="px-3 py-2">
                    {config && row.entityId ? (
                      <Link href={`/admin/${config.key}/${row.entityId}`} className="text-accent-2 hover:underline">
                        {t(`nav.${config.key}`)}
                      </Link>
                    ) : row.entityType === "users" ? (
                      t("nav.users")
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] break-all text-muted-ink">{row.entityId ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {FAILED.includes(row.action) ? <span className="text-primary">✕ {t("audit.fail")}</span> : <span className="text-ok">✓ {t("audit.ok")}</span>}
                  </td>
                  <td className="px-3 py-2 break-words text-muted-ink">{describe(row.details, (code) => (t.has(`status.${code}`) ? t(`status.${code}`) : code))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <nav aria-label={t("table.pagination")} className="flex items-center gap-2 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)} className="rounded-lg border border-border px-3 py-1.5">← {t("table.prev")}</Link>}
          <span className="text-muted-ink">{t("table.page", { page, pageCount })}</span>
          {page < pageCount && <Link href={pageHref(page + 1)} className="rounded-lg border border-border px-3 py-1.5">{t("table.next")} →</Link>}
        </nav>
      )}
    </div>
  );
}
