// Дашборд: приветствие, задачи согласования, состояние каталога, быстрые действия,
// последние действия в журнале (если роль может его видеть).
import { getFormatter, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/require-role";
import { loadQueue } from "@/lib/admin/moderation-queue";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/admin/status-badge";
import { loose } from "@/lib/admin/loose-translator";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin">) {
  const t = loose(await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.nav" }));
  return { title: t("dashboard") };
}

export default async function AdminDashboardPage({ params }: PageProps<"/[locale]/admin">) {
  const locale = (await params).locale as Locale;
  const user = await requireAdminPage(locale);
  const showCatalog = can(user, "documents", "view");
  const [t, format, queue, byStatus, unreadFeedback, recent] = await Promise.all([
    getTranslations({ locale, namespace: "Admin" }).then(loose),
    getFormatter({ locale }),
    loadQueue(user, locale),
    showCatalog ? db.archiveDocument.groupBy({ by: ["status"], _count: { _all: true } }) : [],
    can(user, "feedback", "view") ? db.feedback.count({ where: { isReviewed: false } }) : null,
    can(user, "audit", "view")
      ? db.auditLog.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 8 })
      : [],
  ]);

  const quick = [
    can(user, "documents", "create") && { href: "/admin/documents/new", label: t("dashboard.newDocument") },
    can(user, "import", "create") && { href: "/admin/import", label: t("nav.import") },
    can(user, "news", "create") && { href: "/admin/news/new", label: t("dashboard.newNews") },
    can(user, "exhibitions", "create") && { href: "/admin/exhibitions/new", label: t("dashboard.newExhibition") },
    can(user, "branches", "edit") && { href: "/admin/branches", label: t("nav.branches") },
    can(user, "analytics", "view") && { href: "/admin/analytics", label: t("nav.analytics") },
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">{t("dashboard.hello", { name: user.name })}</h1>
        <p className="mt-1 text-muted-ink">{t(`dashboard.roleIntro.${user.role}`)}</p>
      </div>

      {quick.length > 0 && (
        <nav aria-label={t("dashboard.quick")} className="flex flex-wrap gap-2">
          {quick.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold hover:bg-chip">
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[12px] border border-border bg-surface p-4">
          <h2 className="font-serif text-lg font-bold">{t("dashboard.tasks")}</h2>
          {queue.length === 0 ? (
            <p className="mt-2 text-sm text-muted-ink">{t("dashboard.noTasks")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {queue.slice(0, 8).map((entry) => (
                <li key={`${entry.entity}-${entry.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`/admin/${entry.entity}/${entry.id}`} className="min-w-0 font-bold hover:text-primary hover:underline">
                    {entry.title}
                  </Link>
                  <span className="text-xs text-muted-ink">{t(`moderation.queue.${entry.kind}`)}</span>
                </li>
              ))}
            </ul>
          )}
          {queue.length > 0 && (
            <Link href="/admin/moderation" className="mt-3 inline-block text-sm font-bold text-accent-2 hover:underline">
              {t("dashboard.allTasks", { count: queue.length })}
            </Link>
          )}
        </section>

        {showCatalog && (
          <section className="rounded-[12px] border border-border bg-surface p-4">
            <h2 className="font-serif text-lg font-bold">{t("dashboard.catalog")}</h2>
            <ul className="mt-3 flex flex-wrap gap-3 text-sm">
              {byStatus.map((row) => (
                <li key={row.status}>
                  <Link href={`/admin/documents?status=${row.status}`} className="flex items-center gap-2 hover:underline">
                    <StatusBadge status={row.status} />
                    <b>{row._count._all}</b>
                  </Link>
                </li>
              ))}
            </ul>
            {unreadFeedback !== null && (
              <p className="mt-4 text-sm">
                <Link href="/admin/feedback?filter=new" className="font-bold text-accent-2 hover:underline">
                  {t("dashboard.unreadFeedback", { count: unreadFeedback })}
                </Link>
              </p>
            )}
          </section>
        )}
      </div>

      {recent.length > 0 && (
        <section className="rounded-[12px] border border-border bg-surface p-4">
          <h2 className="font-serif text-lg font-bold">{t("dashboard.recent")}</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {recent.map((row) => (
              <li key={row.id} className="flex flex-wrap gap-x-2">
                <span className="text-muted-ink">{format.dateTime(row.createdAt, { dateStyle: "short", timeStyle: "short" })}</span>
                <b>{row.user?.name ?? t("audit.anonymous")}</b>
                <span>{t.has(`audit.actions.${row.action}`) ? t(`audit.actions.${row.action}`) : row.action}</span>
                {typeof (row.details as { title?: unknown } | null)?.title === "string" && <span className="text-muted-ink">«{(row.details as { title: string }).title}»</span>}
              </li>
            ))}
          </ul>
          <Link href="/admin/audit" className="mt-3 inline-block text-sm font-bold text-accent-2 hover:underline">
            {t("dashboard.openAudit")}
          </Link>
        </section>
      )}
    </div>
  );
}
