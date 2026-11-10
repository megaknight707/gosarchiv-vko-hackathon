// Отзывы и предложения из единственной публичной формы сайта.
import { Download } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/require-role";
import { toggleFeedbackAction } from "@/lib/admin/feedback-actions";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import { loose } from "@/lib/admin/loose-translator";

const PAGE_SIZE = 30;

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/feedback">) {
  const t = loose(await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.nav" }));
  return { title: t("feedback") };
}

export default async function AdminFeedbackPage({ params, searchParams }: PageProps<"/[locale]/admin/feedback">) {
  const locale = (await params).locale as Locale;
  const user = await requireAdminPage(locale, "feedback");
  const search = await searchParams;
  const filter = search.filter === "new" || search.filter === "published" ? search.filter : "all";
  const page = Math.max(1, Number(search.page) || 1);
  const where: Prisma.FeedbackWhereInput = filter === "new" ? { isReviewed: false } : filter === "published" ? { isPublished: true } : {};
  const [t, format, rows, total, unread] = await Promise.all([
    getTranslations({ locale, namespace: "Admin" }).then(loose),
    getFormatter({ locale }),
    db.feedback.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.feedback.count({ where }),
    db.feedback.count({ where: { isReviewed: false } }),
  ]);
  const canEdit = can(user, "feedback", "edit");
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">{t("nav.feedback")}</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- скачивание CSV-файла, а не переход на страницу */}
        <a href="/api/admin/export?entity=feedback" className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-2 hover:underline">
          <Download aria-hidden className="size-4" />
          {t("table.exportCsv")}
        </a>
      </div>
      <nav aria-label={t("feedback.filters")} className="flex flex-wrap gap-2 text-sm">
        {(["all", "new", "published"] as const).map((key) => (
          <Link
            key={key}
            href={key === "all" ? "/admin/feedback" : `/admin/feedback?filter=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={cn("rounded-full border px-3 py-1.5 font-bold", filter === key ? "border-ink bg-ink text-bg" : "border-border hover:bg-chip")}
          >
            {t(`feedback.${key}`)}
            {key === "new" && unread > 0 && ` (${unread})`}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-muted-ink">{t("feedback.privacy")}</p>
      {rows.length === 0 && <p className="text-muted-ink">{t("table.empty")}</p>}
      <ul className="space-y-3">
        {rows.map((item) => (
          <li key={item.id} className={cn("rounded-[12px] border bg-surface p-4", item.isReviewed ? "border-border" : "border-accent-2")}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-ink">
              <span className="rounded bg-chip px-1.5 py-0.5 font-bold">{t(`feedback.kinds.${item.kind}`)}</span>
              <span>{format.dateTime(item.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
              <span className="uppercase">{item.locale}</span>
              {!item.isReviewed && <span className="font-bold text-accent-2">● {t("feedback.unread")}</span>}
              {item.isPublished && <span className="font-bold text-ok">✓ {t("feedback.onSite")}</span>}
            </div>
            <p className="mt-2 whitespace-pre-line">{item.message}</p>
            {(item.name || item.email) && (
              <p className="mt-2 text-sm text-muted-ink">
                {item.name}
                {item.name && item.email && " · "}
                {item.email && <a href={`mailto:${item.email}`} className="underline">{item.email}</a>}
              </p>
            )}
            {canEdit && (
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <form action={toggleFeedbackAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="field" value="isReviewed" />
                  <input type="hidden" name="value" value={String(!item.isReviewed)} />
                  <button type="submit" className="rounded-full border border-border px-3 py-1 font-bold hover:bg-chip">
                    {item.isReviewed ? t("feedback.markUnread") : t("feedback.markRead")}
                  </button>
                </form>
                {item.kind === "REVIEW" && (
                  <form action={toggleFeedbackAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="field" value="isPublished" />
                    <input type="hidden" name="value" value={String(!item.isPublished)} />
                    <button type="submit" className="rounded-full border border-border px-3 py-1 font-bold hover:bg-chip">
                      {item.isPublished ? t("feedback.unpublish") : t("feedback.publish")}
                    </button>
                  </form>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {pageCount > 1 && (
        <nav aria-label={t("table.pagination")} className="flex items-center gap-2 text-sm">
          {page > 1 && <Link href={`/admin/feedback?filter=${filter}&page=${page - 1}`} className="rounded-lg border border-border px-3 py-1.5">← {t("table.prev")}</Link>}
          <span className="text-muted-ink">{t("table.page", { page, pageCount })}</span>
          {page < pageCount && <Link href={`/admin/feedback?filter=${filter}&page=${page + 1}`} className="rounded-lg border border-border px-3 py-1.5">{t("table.next")} →</Link>}
        </nav>
      )}
    </div>
  );
}
