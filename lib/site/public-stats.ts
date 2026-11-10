// Публичная статистика сайта (Дополнения к ТЗ §2, «Статистика сайта»): только сводная цифра
// просмотров разделов за 30 дней из таблицы PageView — без посетителей, IP и cookie.
import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const getPublicViews = cache(async (): Promise<number | null> => {
  try {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const result = await db.pageView.aggregate({ where: { day: { gte: since } }, _sum: { count: true } });
    return result._sum.count ?? 0;
  } catch {
    return null; // статистика не важнее подвала
  }
});
