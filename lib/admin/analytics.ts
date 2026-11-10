// Аналитика для дашборда (ТЗ §5.8-Д): только агрегированные данные без персональных сведений —
// счётчики просмотров разделов, поисковые запросы (без IP), отзывы по видам.
import "server-only";
import { db } from "@/lib/db";

export type AnalyticsPeriod = 7 | 30 | 90;

export async function loadAnalytics(days: AnalyticsPeriod) {
  const since = new Date(Date.now() - days * 86_400_000);

  const [views, searches, topQueries, zeroQueries, feedbackByKind, perDay] = await Promise.all([
    db.pageView.groupBy({ by: ["path"], where: { day: { gte: since } }, _sum: { count: true }, orderBy: { _sum: { count: "desc" } } }),
    db.searchLog.groupBy({ by: ["source"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.$queryRaw<{ query: string; count: bigint; avgResults: number }[]>`
      SELECT lower(trim("query")) AS query, count(*) AS count, avg("resultsCount")::float AS "avgResults"
      FROM "SearchLog" WHERE "createdAt" >= ${since} AND length(trim("query")) > 0
      GROUP BY 1 ORDER BY count DESC LIMIT 10`,
    db.$queryRaw<{ query: string; count: bigint }[]>`
      SELECT lower(trim("query")) AS query, count(*) AS count
      FROM "SearchLog" WHERE "createdAt" >= ${since} AND "resultsCount" = 0 AND length(trim("query")) > 0
      GROUP BY 1 ORDER BY count DESC LIMIT 10`,
    db.feedback.groupBy({ by: ["kind"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
      FROM "SearchLog" WHERE "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`,
  ]);

  const totalSearches = searches.reduce((sum, s) => sum + s._count._all, 0);
  const aiSearches = searches.find((s) => s.source === "AI")?._count._all ?? 0;
  return {
    days,
    views: views.map((v) => ({ section: v.path, count: v._sum.count ?? 0 })),
    totalViews: views.reduce((sum, v) => sum + (v._sum.count ?? 0), 0),
    totalSearches,
    aiSearches,
    aiShare: totalSearches ? Math.round((aiSearches / totalSearches) * 100) : 0,
    topQueries: topQueries.map((q) => ({ query: q.query, count: Number(q.count), avgResults: Math.round(q.avgResults) })),
    zeroQueries: zeroQueries.map((q) => ({ query: q.query, count: Number(q.count) })),
    feedback: feedbackByKind.map((f) => ({ kind: f.kind, count: f._count._all })),
    searchesPerDay: perDay.map((d) => ({ day: d.day.toISOString().slice(0, 10), count: Number(d.count) })),
  };
}

export type Analytics = Awaited<ReturnType<typeof loadAnalytics>>;
