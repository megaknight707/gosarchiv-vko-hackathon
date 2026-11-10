// Онлайн-выставки: список и одна выставка с экспонатами (только опубликованные).
import "server-only";
import { cache } from "react";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { pickLocale } from "@/lib/i18n/pick-locale";

export type ExhibitionCard = {
  slug: string;
  title: string;
  description: string;
  period: string;
  theme: string | null;
  coverUrl: string | null;
  exhibitsCount: number;
  /** Годы, которые охватывает выставка (из подписи периода) — для фильтра */
  yearFrom: number | null;
  yearTo: number | null;
};

export type ExhibitView = {
  id: string;
  order: number;
  title: string;
  text: string;
  section: string | null;
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
  document: { id: string; cipher: string; title: string } | null;
};

/** «1920-е — 2000-е» → 1920…2009, «1941–1945» → 1941…1945 */
function yearsOf(label: string): { yearFrom: number | null; yearTo: number | null } {
  const years = [...label.matchAll(/\d{4}/g)].map((m) => Number(m[0]));
  if (years.length === 0) return { yearFrom: null, yearTo: null };
  const last = years[years.length - 1];
  const isDecade = /\d{4}\s*-?\s*(е|х|s|жыл)/i.test(label.slice(label.lastIndexOf(String(last))));
  return { yearFrom: years[0], yearTo: isDecade ? last + 9 : last };
}

export const listExhibitions = cache(async (locale: Locale): Promise<ExhibitionCard[]> => {
  try {
    const items = await db.exhibition.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { exhibits: true } } },
    });
    return items.map((e) => ({
      slug: e.slug,
      title: pickLocale(e, "title", locale),
      description: pickLocale(e, "description", locale),
      period: pickLocale(e, "periodLabel", locale),
      theme: e.theme,
      coverUrl: e.coverUrl,
      exhibitsCount: e._count.exhibits,
      ...yearsOf(e.periodLabelRu ?? ""),
    }));
  } catch (error) {
    console.error("Не удалось загрузить выставки:", error);
    return [];
  }
});

export const getExhibition = cache(async (slug: string, locale: Locale) => {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const e = await db.exhibition.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      exhibits: {
        orderBy: { order: "asc" },
        include: { document: { select: { id: true, cipher: true, titleKz: true, titleRu: true, titleEn: true, status: true } } },
      },
    },
  });
  if (!e) return null;
  return {
    slug: e.slug,
    title: pickLocale(e, "title", locale),
    description: pickLocale(e, "description", locale),
    period: pickLocale(e, "periodLabel", locale),
    coverUrl: e.coverUrl,
    isDemo: e.isDemo,
    exhibits: e.exhibits.map<ExhibitView>((x) => ({
      id: x.id,
      order: x.order,
      title: pickLocale(x, "title", locale),
      text: pickLocale(x, "text", locale),
      section: pickLocale(x, "sourceNote", locale) || null,
      mediaUrl: x.mediaUrl,
      mediaType: x.mediaType,
      document:
        x.document && x.document.status === "PUBLISHED"
          ? { id: x.document.id, cipher: x.document.cipher, title: pickLocale(x.document, "title", locale) }
          : null,
    })),
  };
});
