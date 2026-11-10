// GET /api/catalog/cards?ids=a,b,c&locale=ru — данные карточек для страницы «Избранное».
// Возвращает только опубликованные документы; список id проверяется zod.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { routing } from "@/i18n/routing";

const querySchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(",").filter(Boolean))
    .pipe(z.array(z.string().regex(/^[a-z0-9]{10,40}$/)).max(200)),
  locale: z.enum(routing.locales),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  const { ids, locale } = parsed.data;
  if (ids.length === 0) return NextResponse.json({ items: [] });

  const docs = await db.archiveDocument.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    include: {
      place: { select: { nameKz: true, nameRu: true, nameEn: true } },
      files: { where: { pageNumber: 1 }, select: { previewUrl: true }, take: 1 },
    },
  });
  const byId = new Map(docs.map((d) => [d.id, d]));

  // Порядок — как в избранном (последние добавленные сверху)
  const items = ids.flatMap((id) => {
    const doc = byId.get(id);
    if (!doc) return [];
    return [
      {
        id: doc.id,
        title: pickLocale(doc, "title", locale),
        cipher: doc.cipher,
        docType: doc.docType,
        yearLabel: doc.yearFrom ? String(doc.yearFrom) : null,
        placeName: doc.place ? pickLocale(doc.place, "name", locale) : null,
        accessStatus: doc.accessStatus,
        previewUrl: doc.accessStatus === "OPEN" ? (doc.files[0]?.previewUrl ?? null) : null,
        isDemo: doc.isDemo,
      },
    ];
  });

  return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
}
