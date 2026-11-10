// «Календарь памятных дат» Госархива ВКО: официальные списки дат на каждый год (KZ и RU).
// Английского текста в источнике нет — для EN отдаём русский и помечаем это в интерфейсе.
import "server-only";
import { cache } from "react";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";

export type MemorableDateView = {
  id: string;
  month: number | null;
  day: number | null;
  dateLabel: string;
  text: string;
};

/** Годы, за которые есть календарь (по убыванию) */
export const getCalendarYears = cache(async (): Promise<number[]> => {
  try {
    const rows = await db.memorableDate.groupBy({
      by: ["calendarYear"],
      where: { status: "PUBLISHED" },
      orderBy: { calendarYear: "desc" },
    });
    return rows.map((r) => r.calendarYear);
  } catch (error) {
    console.error("Не удалось загрузить годы календаря:", error);
    return [];
  }
});

/** Даты выбранного года (и месяца, если указан): сначала по месяцам и дням, затем «известные по году» */
export async function getMemorableDates(locale: Locale, year: number, month?: number): Promise<MemorableDateView[]> {
  try {
    const rows = await db.memorableDate.findMany({
      where: { status: "PUBLISHED", calendarYear: year, ...(month ? { month } : {}) },
      orderBy: [{ month: { sort: "asc", nulls: "last" } }, { day: { sort: "asc", nulls: "last" } }, { sortOrder: "asc" }],
    });
    const kz = locale === "kz";
    return rows.map((r) => ({
      id: r.id,
      month: r.month,
      day: r.day,
      dateLabel: kz ? r.dateLabelKz : r.dateLabelRu,
      text: kz ? r.textKz : r.textRu,
    }));
  } catch (error) {
    console.error("Не удалось загрузить памятные даты:", error);
    return [];
  }
}

/** Сколько дат в каждом месяце года — для переключателя месяцев */
export async function getMonthCounts(year: number): Promise<Map<number, number>> {
  try {
    const rows = await db.memorableDate.groupBy({
      by: ["month"],
      where: { status: "PUBLISHED", calendarYear: year, month: { not: null } },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.month as number, r._count._all]));
  } catch {
    return new Map();
  }
}
