// Новости: список с фильтром по категории, поиском, сортировкой и пагинацией; одна новость.
import "server-only";
import { z } from "zod";
import type { Locale } from "@/i18n/routing";
import type { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";

export const NEWS_CATEGORIES = ["EXHIBITION", "CONFERENCE", "EVENT", "RESEARCH", "BRANCH"] as const;
export const NEWS_PAGE_SIZE = 9;

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
export const newsQuerySchema = z.object({
  category: z.preprocess(first, z.enum(NEWS_CATEGORIES).optional().catch(undefined)),
  q: z.preprocess(first, z.string().trim().max(100).optional().catch(undefined)),
  sort: z.preprocess(first, z.enum(["new", "old"]).optional().catch(undefined)),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(500).optional().catch(undefined)),
});
export type NewsQuery = z.infer<typeof newsQuerySchema>;

const SUFFIX = { kz: "Kz", ru: "Ru", en: "En" } as const;

export async function listNews(query: NewsQuery, locale: Locale) {
  const where: Prisma.NewsWhereInput = { status: "PUBLISHED" };
  if (query.category) where.category = query.category;
  if (query.q) {
    const s = SUFFIX[locale];
    where.OR = [
      { [`title${s}`]: { contains: query.q, mode: "insensitive" } },
      { [`excerpt${s}`]: { contains: query.q, mode: "insensitive" } },
      { titleRu: { contains: query.q, mode: "insensitive" } },
    ];
  }
  const page = query.page ?? 1;
  try {
    const [total, items] = await Promise.all([
      db.news.count({ where }),
      db.news.findMany({
        where,
        orderBy: { publishedAt: query.sort === "old" ? "asc" : "desc" },
        skip: (page - 1) * NEWS_PAGE_SIZE,
        take: NEWS_PAGE_SIZE,
        include: { branch: { select: { nameKz: true, nameRu: true, nameEn: true } } },
      }),
    ]);
    return { items, total, page, pageCount: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)) };
  } catch (error) {
    console.error("Не удалось загрузить новости:", error);
    return { items: [], total: 0, page: 1, pageCount: 1 };
  }
}

export async function getNewsItem(slug: string) {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  return db.news.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { branch: { select: { slug: true, nameKz: true, nameRu: true, nameEn: true } } },
  });
}

export async function getRelatedNews(id: string, category: string, take = 3) {
  return db.news.findMany({
    where: { status: "PUBLISHED", id: { not: id } },
    orderBy: [{ publishedAt: "desc" }],
    take: 10,
  }).then((items) => [...items.filter((n) => n.category === category), ...items.filter((n) => n.category !== category)].slice(0, take));
}
