// Загрузка карточки документа и связанных материалов. Только опубликованные записи.
import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const getPublishedDocument = cache(async (id: string) => {
  if (!/^[a-z0-9]{10,40}$/.test(id)) return null;
  return db.archiveDocument.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      storageUnit: { include: { inventory: { include: { fund: { include: { category: true } } } } } },
      place: true,
      branch: true,
      tags: true,
      files: { orderBy: { pageNumber: "asc" } },
    },
  });
});

export type PublishedDocument = NonNullable<Awaited<ReturnType<typeof getPublishedDocument>>>;

/**
 * Связанные материалы: тот же фонд, место, тема или близкий период.
 * Простая оценка «похожести» — чем больше совпадений, тем выше в списке.
 */
export async function getRelatedDocuments(doc: PublishedDocument, limit = 6) {
  const fundId = doc.storageUnit.inventory.fundId;
  const tagIds = doc.tags.map((t) => t.id);
  const year = doc.yearFrom ?? doc.yearTo;

  const candidates = await db.archiveDocument.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: doc.id },
      OR: [
        { storageUnit: { inventory: { fundId } } },
        ...(doc.placeId ? [{ placeId: doc.placeId }] : []),
        ...(tagIds.length ? [{ tags: { some: { id: { in: tagIds } } } }] : []),
      ],
    },
    take: 60,
    include: {
      storageUnit: { select: { inventory: { select: { fundId: true } } } },
      tags: { select: { id: true } },
      place: { select: { nameKz: true, nameRu: true, nameEn: true } },
      files: { where: { pageNumber: 1 }, select: { previewUrl: true }, take: 1 },
    },
  });

  return candidates
    .map((c) => {
      let score = 0;
      if (c.storageUnit.inventory.fundId === fundId) score += 3;
      if (doc.placeId && c.placeId === doc.placeId) score += 2;
      score += c.tags.filter((t) => tagIds.includes(t.id)).length * 2;
      if (year && c.yearFrom && Math.abs(c.yearFrom - year) <= 10) score += 2;
      if (c.docType === doc.docType) score += 1;
      return { doc: c, score };
    })
    .sort((a, b) => b.score - a.score || (a.doc.yearFrom ?? 0) - (b.doc.yearFrom ?? 0))
    .slice(0, limit)
    .map((r) => r.doc);
}
