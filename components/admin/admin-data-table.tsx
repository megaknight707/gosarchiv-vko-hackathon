// Универсальная таблица раздела админки: поиск, фильтр по статусу, сортировка по колонкам,
// постраничный вывод и массовые действия. Всё состояние — в адресе (?q=…&status=…&sort=…),
// работает без JavaScript: поиск — обычная форма GET, массовые действия — Server Action.
import { ArrowDown, ArrowUp, Plus, Search } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { can, type PermissionSubject } from "@/lib/auth/permissions";
import { bulkAction } from "@/lib/admin/entity-actions";
import type { EntityConfig, ListColumn } from "@/lib/admin/entity-config";
import { STATUSES, type ListParams } from "@/lib/admin/entity-service";
import type { PublicationStatus } from "@/lib/generated/prisma/client";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { StatusBadge } from "./status-badge";
import { loose } from "@/lib/admin/loose-translator";

type Row = Record<string, unknown> & { id: string };

function sortKey(column: ListColumn) {
  return column.localized ? `${column.name}Ru` : column.name;
}

export async function AdminDataTable({
  config,
  user,
  locale,
  rows,
  total,
  page,
  pageCount,
  sort,
  dir,
  params,
}: {
  config: EntityConfig;
  user: PermissionSubject;
  locale: Locale;
  rows: Row[];
  total: number;
  page: number;
  pageCount: number;
  sort: string;
  dir: string;
  params: ListParams;
}) {
  const t = loose(await getTranslations({ locale, namespace: "Admin" }));
  const format = await getFormatter({ locale });
  const base = `/admin/${config.key}`;
  const query = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: params.q, status: params.status, sort, dir, page, ...patch };
    for (const [key, value] of Object.entries(merged)) if (value !== undefined && value !== "" && value !== null) next.set(key, String(value));
    return `${base}?${next.toString()}`;
  };

  const bulkOps = (["submit", "approve", "publish", "archive"] as const)
    .filter(() => config.moderated)
    .filter((op) => can(user, config.key, op === "approve" ? "moderate" : op === "submit" ? "submit" : "publish"));
  const canDelete = can(user, config.key, "delete");
  const hasBulk = bulkOps.length > 0 || canDelete;

  const cell = (row: Row, column: ListColumn) => {
    const value = row[column.name];
    switch (column.format) {
      case "status":
        return <StatusBadge status={value as PublicationStatus} />;
      case "date":
        return value ? format.dateTime(value as Date, { dateStyle: "medium" }) : "—";
      case "boolean":
        return value ? t("yes") : t("no");
      case "enum":
        return value ? t(`enums.${column.labels}.${value}`) : "—";
      case "mono":
        return <span className="font-mono text-xs whitespace-nowrap">{String(value ?? "—")}</span>;
      case "relation": {
        const related = column.relation ? (row[column.relation.include] as Record<string, string> | null) : null;
        if (!related || !column.relation) return "—";
        return column.relation.localized ? pickLocale(related, column.relation.field, locale) : related[column.relation.field];
      }
      default:
        return column.localized ? pickLocale(row as Record<string, string>, column.name, locale) || "—" : String(value ?? "—");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form action={`/${locale}${base}`} method="get" role="search" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="admin-q" className="mb-1 block text-xs font-bold text-muted-ink">
              {t("table.search")}
            </label>
            <input id="admin-q" name="q" type="search" defaultValue={params.q} className="admin-input w-64 max-w-full" />
          </div>
          {config.moderated && (
            <div>
              <label htmlFor="admin-status" className="mb-1 block text-xs font-bold text-muted-ink">
                {t("table.status")}
              </label>
              <select id="admin-status" name="status" defaultValue={params.status ?? ""} className="admin-input">
                <option value="">{t("table.allStatuses")}</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-surface px-3 py-2 text-sm font-bold hover:bg-chip">
            <Search aria-hidden className="size-4" />
            {t("table.apply")}
          </button>
          {(params.q || params.status) && (
            <Link href={base} className="px-2 py-2 text-sm text-primary underline">
              {t("table.reset")}
            </Link>
          )}
        </form>
        {can(user, config.key, "create") && (
          <Link href={`${base}/new`} className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
            <Plus aria-hidden className="size-4" />
            {t("table.create")}
          </Link>
        )}
      </div>

      <p className="text-sm text-muted-ink" aria-live="polite">
        {t("table.found", { count: total })}
      </p>

      <form action={bulkAction.bind(null, config.key, locale)}>
        <div className="overflow-x-auto rounded-[12px] border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-chip/60 text-left">
              <tr>
                {hasBulk && (
                  <th scope="col" className="w-10 px-3 py-2">
                    <span className="sr-only">{t("table.select")}</span>
                  </th>
                )}
                {config.columns.map((column) => {
                  const key = sortKey(column);
                  const active = sort === key;
                  return (
                    <th key={column.name} scope="col" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined} className="px-3 py-2 font-bold whitespace-nowrap">
                      {column.sortable ? (
                        <Link href={query({ sort: key, dir: active && dir === "asc" ? "desc" : "asc", page: 1 })} className="inline-flex items-center gap-1 hover:text-primary">
                          {t(`fields.${column.name}`)}
                          {active && (dir === "asc" ? <ArrowUp aria-hidden className="size-3.5" /> : <ArrowDown aria-hidden className="size-3.5" />)}
                        </Link>
                      ) : (
                        t(`fields.${column.name}`)
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={config.columns.length + 1} className="px-3 py-8 text-center text-muted-ink">
                    {t("table.empty")}
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-chip/40">
                  {hasBulk && (
                    <td className="px-3 py-2">
                      <input type="checkbox" name="ids" value={row.id} aria-label={t("table.selectRow")} className="size-4 accent-[var(--accent)]" />
                    </td>
                  )}
                  {config.columns.map((column, i) => (
                    <td key={column.name} className="px-3 py-2 align-top">
                      {i === 0 || column.name === config.titleField.name ? (
                        <Link href={`${base}/${row.id}`} className="font-bold hover:text-primary hover:underline">
                          {cell(row, column)}
                        </Link>
                      ) : (
                        cell(row, column)
                      )}
                      {column.name === config.titleField.name && Boolean(row.isDemo) && (
                        <span className="ml-2 rounded bg-lock-soft px-1 text-[10px] font-bold text-lock uppercase">{t("demo")}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasBulk && rows.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-ink">{t("table.bulk")}</span>
            {bulkOps.map((op) => (
              <button key={op} type="submit" name="bulk" value={op} className="rounded-full border border-border bg-surface px-3 py-1.5 font-bold hover:bg-chip">
                {t(`transitions.${op}`)}
              </button>
            ))}
            {canDelete && (
              <button type="submit" name="bulk" value="delete" className="rounded-full border border-primary/40 px-3 py-1.5 font-bold text-primary hover:bg-primary/10">
                {t("table.delete")}
              </button>
            )}
          </div>
        )}
      </form>

      {pageCount > 1 && (
        <nav aria-label={t("table.pagination")} className="flex items-center gap-2 text-sm">
          {page > 1 && (
            <Link href={query({ page: page - 1 })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-chip">
              ← {t("table.prev")}
            </Link>
          )}
          <span className="text-muted-ink">{t("table.page", { page, pageCount })}</span>
          {page < pageCount && (
            <Link href={query({ page: page + 1 })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-chip">
              {t("table.next")} →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
