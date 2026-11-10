// Аналитика: популярные разделы, поисковые запросы, запросы без результатов, доля ИИ, отзывы.
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/auth/require-role";
import { loadAnalytics, type AnalyticsPeriod } from "@/lib/admin/analytics";
import { cn } from "@/lib/utils";
import { AiRecommendationsPanel } from "@/components/admin/ai-recommendations-panel";
import { BarChart, DailyColumns } from "@/components/admin/bar-chart";
import { loose } from "@/lib/admin/loose-translator";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/analytics">) {
  const t = loose(await getTranslations({ locale: (await params).locale as Locale, namespace: "Admin.nav" }));
  return { title: t("analytics") };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[12px] border border-border bg-surface p-4">
      <p className="text-xs font-bold text-muted-ink uppercase">{label}</p>
      <p className="mt-1 font-serif text-3xl font-bold">{value}</p>
    </div>
  );
}

export default async function AdminAnalyticsPage({ params, searchParams }: PageProps<"/[locale]/admin/analytics">) {
  const locale = (await params).locale as Locale;
  await requireAdminPage(locale, "analytics");
  const requested = Number((await searchParams).days);
  const days: AnalyticsPeriod = requested === 7 || requested === 90 ? requested : 30;
  const [t, stats] = await Promise.all([getTranslations({ locale, namespace: "Admin" }).then(loose), loadAnalytics(days)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">{t("nav.analytics")}</h1>
        <nav aria-label={t("analytics.period")} className="flex gap-1 text-sm">
          {([7, 30, 90] as const).map((d) => (
            <Link key={d} href={`/admin/analytics?days=${d}`} aria-current={d === days ? "page" : undefined} className={cn("rounded-full border px-3 py-1.5 font-bold", d === days ? "border-ink bg-ink text-bg" : "border-border hover:bg-chip")}>
              {t("analytics.days", { count: d })}
            </Link>
          ))}
        </nav>
      </div>
      <p className="text-sm text-muted-ink">{t("analytics.privacy")}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("analytics.views")} value={stats.totalViews} />
        <Stat label={t("analytics.searches")} value={stats.totalSearches} />
        <Stat label={t("analytics.aiShare")} value={`${stats.aiShare}%`} />
        <Stat label={t("analytics.zeroCount")} value={stats.zeroQueries.reduce((s, q) => s + q.count, 0)} />
      </div>

      <AiRecommendationsPanel locale={locale} days={days} />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[12px] border border-border bg-surface p-4">
          <h2 className="mb-3 font-serif text-lg font-bold">{t("analytics.popularSections")}</h2>
          {stats.views.length ? (
            <BarChart label={t("analytics.popularSections")} items={stats.views.map((v) => ({ label: t.has(`analytics.sections.${v.section}`) ? t(`analytics.sections.${v.section}`) : v.section, value: v.count }))} />
          ) : (
            <p className="text-sm text-muted-ink">{t("analytics.noData")}</p>
          )}
        </section>
        <section className="rounded-[12px] border border-border bg-surface p-4">
          <h2 className="mb-3 font-serif text-lg font-bold">{t("analytics.searchesPerDay")}</h2>
          {stats.searchesPerDay.length ? <DailyColumns label={t("analytics.searchesPerDay")} points={stats.searchesPerDay} /> : <p className="text-sm text-muted-ink">{t("analytics.noData")}</p>}
          <p className="mt-2 text-xs text-muted-ink">{t("analytics.aiSplit", { ai: stats.aiSearches, catalog: stats.totalSearches - stats.aiSearches })}</p>
        </section>
        <section className="rounded-[12px] border border-border bg-surface p-4">
          <h2 className="mb-3 font-serif text-lg font-bold">{t("analytics.topQueries")}</h2>
          {stats.topQueries.length ? <BarChart label={t("analytics.topQueries")} items={stats.topQueries.map((q) => ({ label: q.query, value: q.count }))} /> : <p className="text-sm text-muted-ink">{t("analytics.noData")}</p>}
        </section>
        <section className="rounded-[12px] border border-primary/30 bg-surface p-4">
          <h2 className="mb-1 font-serif text-lg font-bold">{t("analytics.zeroQueries")}</h2>
          <p className="mb-3 text-xs text-muted-ink">{t("analytics.zeroHint")}</p>
          {stats.zeroQueries.length ? <BarChart label={t("analytics.zeroQueries")} items={stats.zeroQueries.map((q) => ({ label: q.query, value: q.count }))} /> : <p className="text-sm text-muted-ink">{t("analytics.noZero")}</p>}
        </section>
        <section className="rounded-[12px] border border-border bg-surface p-4">
          <h2 className="mb-3 font-serif text-lg font-bold">{t("analytics.feedback")}</h2>
          {stats.feedback.length ? <BarChart label={t("analytics.feedback")} items={stats.feedback.map((f) => ({ label: t(`feedback.kinds.${f.kind}`), value: f.count }))} /> : <p className="text-sm text-muted-ink">{t("analytics.noData")}</p>}
        </section>
      </div>
    </div>
  );
}
