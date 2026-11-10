// «Архив памяти»: тематические направления, коллекции, хронология, личности.
import "server-only";
import { cache } from "react";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { pickLocale } from "@/lib/i18n/pick-locale";

/** Тематические направления ТЗ §5.6 → куда ведут и как считаются материалы */
const DIRECTIONS = [
  { key: "region", href: "/catalog?topic=governance,agriculture,virgin-lands", tags: ["governance", "agriculture", "virgin-lands"] },
  { key: "city", href: "/catalog?place=ust-kamenogorsk", place: "ust-kamenogorsk" },
  { key: "industry", href: "/catalog?topic=industry,energy,construction", tags: ["industry", "energy", "construction"] },
  { key: "persons", href: "/memory/persons", persons: true },
  { key: "education", href: "/catalog?topic=education,science", tags: ["education", "science"] },
  { key: "culture", href: "/catalog?topic=culture,sport", tags: ["culture", "sport"] },
  { key: "military", href: "/catalog?topic=partisans", tags: ["partisans"] },
  { key: "ww2", href: "/catalog?topic=war", tags: ["war"] },
  { key: "family", href: null },
  { key: "public", href: null },
  { key: "periods", href: "/memory/timeline", events: true },
] as const;

export type DirectionKey = (typeof DIRECTIONS)[number]["key"];

export const getDirections = cache(async () => {
  try {
    return await Promise.all(
      DIRECTIONS.map(async (d) => {
        let count = 0;
        if ("tags" in d) count = await db.archiveDocument.count({ where: { status: "PUBLISHED", tags: { some: { slug: { in: [...d.tags] } } } } });
        else if ("place" in d) count = await db.archiveDocument.count({ where: { status: "PUBLISHED", place: { slug: d.place } } });
        else if ("persons" in d) count = await db.historicalPerson.count({ where: { status: "PUBLISHED" } });
        else if ("events" in d) count = await db.historicalEvent.count({ where: { status: "PUBLISHED" } });
        return { key: d.key as DirectionKey, href: count > 0 ? d.href : null, count };
      }),
    );
  } catch (error) {
    console.error("Не удалось посчитать направления:", error);
    return DIRECTIONS.map((d) => ({ key: d.key as DirectionKey, href: null, count: 0 }));
  }
});

export const listCollections = cache(async (locale: Locale) => {
  try {
    const items = await db.collection.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { documents: { where: { status: "PUBLISHED" } } } } },
    });
    return items.map((c) => ({
      slug: c.slug,
      title: pickLocale(c, "title", locale),
      description: pickLocale(c, "description", locale),
      period: pickLocale(c, "periodLabel", locale),
      coverUrl: c.coverUrl,
      count: c._count.documents,
    }));
  } catch (error) {
    console.error("Не удалось загрузить коллекции:", error);
    return [];
  }
});

export async function getCollection(slug: string) {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  return db.collection.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      documents: {
        where: { status: "PUBLISHED" },
        orderBy: { yearFrom: "asc" },
        include: {
          place: { select: { nameKz: true, nameRu: true, nameEn: true } },
          files: { where: { pageNumber: 1 }, select: { previewUrl: true }, take: 1 },
        },
      },
    },
  });
}

export const getTimeline = cache(async (locale: Locale) => {
  try {
    const events = await db.historicalEvent.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { year: "asc" },
      include: { documents: { where: { status: "PUBLISHED" }, select: { id: true, cipher: true, titleKz: true, titleRu: true, titleEn: true }, take: 6 } },
    });
    return events.map((e) => ({
      id: e.id,
      year: e.year,
      theme: e.theme ?? "region",
      title: pickLocale(e, "title", locale),
      description: pickLocale(e, "description", locale) || null,
      source: pickLocale(e, "sourceNote", locale) || null,
      documents: e.documents.map((d) => ({ id: d.id, cipher: d.cipher, title: pickLocale(d, "title", locale) })),
    }));
  } catch (error) {
    console.error("Не удалось загрузить хронологию:", error);
    return [];
  }
});

export const listPersons = cache(async (locale: Locale) => {
  try {
    const persons = await db.historicalPerson.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { nameRu: "asc" },
      include: { fund: { select: { number: true } }, _count: { select: { documents: true } } },
    });
    return persons.map((p) => ({
      slug: p.slug,
      name: pickLocale(p, "name", locale),
      bio: pickLocale(p, "bio", locale),
      fundNumber: p.fund?.number ?? null,
      docs: p._count.documents,
    }));
  } catch (error) {
    console.error("Не удалось загрузить личности:", error);
    return [];
  }
});

export async function getPerson(slug: string) {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  return db.historicalPerson.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      fund: { select: { number: true, titleKz: true, titleRu: true, titleEn: true } },
      documents: {
        where: { status: "PUBLISHED" },
        orderBy: { yearFrom: "asc" },
        include: {
          place: { select: { nameKz: true, nameRu: true, nameEn: true } },
          files: { where: { pageNumber: 1 }, select: { previewUrl: true }, take: 1 },
        },
      },
    },
  });
}

/** Варианты для поиска по материалам: темы и населённые пункты */
export const getMemorySearchOptions = cache(async (locale: Locale) => {
  try {
    const [tags, places] = await Promise.all([db.tag.findMany({ orderBy: { slug: "asc" } }), db.place.findMany({ orderBy: { slug: "asc" } })]);
    return {
      topics: tags.map((t) => ({ value: t.slug, label: pickLocale(t, "name", locale) })),
      places: places.map((p) => ({ value: p.slug, label: pickLocale(p, "name", locale) })),
    };
  } catch {
    return { topics: [], places: [] };
  }
});
