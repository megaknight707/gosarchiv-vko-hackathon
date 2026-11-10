// Загрузка «Архива памяти» и онлайн-выставок (выставки, экспонаты, коллекции, хронология, личности).
//   npm run seed:memory       — локально
//   npm run prod:seed:memory  — на продакшен-базу
// Пересоздаёт эти таблицы целиком; документы каталога не трогает, а только связывает с ними.
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { collections, events, exhibitions, persons } from "./demo-data/memory";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const LOCAL_DB = "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";

export async function seedMemory(db: PrismaClient) {
  // Документы каталога по названию — к ним привязываются экспонаты и коллекции
  const docs = await db.archiveDocument.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      titleRu: true,
      docType: true,
      accessStatus: true,
      tags: { select: { slug: true } },
      storageUnit: { select: { inventory: { select: { fund: { select: { number: true } } } } } },
      files: { orderBy: { pageNumber: "asc" }, take: 1, select: { url: true, previewUrl: true } },
    },
  });
  const byTitle = new Map(docs.map((d) => [d.titleRu, d]));
  const find = (title: string) => {
    const doc = byTitle.get(title);
    if (!doc) throw new Error(`Документ «${title}» не найден в каталоге — сначала npm run seed`);
    return doc;
  };
  const imageOf = (doc: (typeof docs)[number]) => (doc.accessStatus === "OPEN" ? doc.files[0]?.url : undefined);

  await db.exhibit.deleteMany();
  await db.exhibition.deleteMany();
  await db.collection.deleteMany();
  await db.historicalEvent.deleteMany();
  await db.historicalPerson.deleteMany();

  for (const exhibition of exhibitions) {
    const linked = exhibition.exhibits.map((e) => (e.doc ? find(e.doc) : undefined));
    const cover = exhibition.cover ? find(exhibition.cover) : linked.find((d) => d && d.docType === "PHOTO" && imageOf(d));
    await db.exhibition.create({
      data: {
        slug: exhibition.slug,
        theme: exhibition.theme,
        sortOrder: exhibition.sortOrder,
        titleKz: exhibition.title.kz,
        titleRu: exhibition.title.ru,
        titleEn: exhibition.title.en,
        descriptionKz: exhibition.description.kz,
        descriptionRu: exhibition.description.ru,
        descriptionEn: exhibition.description.en,
        periodLabelKz: exhibition.period.kz,
        periodLabelRu: exhibition.period.ru,
        periodLabelEn: exhibition.period.en,
        coverUrl: cover ? imageOf(cover) : null,
        status: "PUBLISHED",
        isDemo: true,
        exhibits: {
          create: exhibition.exhibits.map((exhibit, index) => {
            const doc = linked[index];
            const image = doc ? imageOf(doc) : undefined;
            return {
              order: index + 1,
              titleKz: exhibit.title.kz,
              titleRu: exhibit.title.ru,
              titleEn: exhibit.title.en,
              textKz: exhibit.text.kz,
              textRu: exhibit.text.ru,
              textEn: exhibit.text.en,
              // Название раздела выставки храним в sourceNote (раздел начинается с этого экспоната)
              sourceNoteKz: exhibit.section?.kz ?? null,
              sourceNoteRu: exhibit.section?.ru ?? null,
              sourceNoteEn: exhibit.section?.en ?? null,
              mediaUrl: image ?? null,
              mediaType: image ? ("IMAGE" as const) : ("DOCUMENT" as const),
              documentId: doc?.id,
            };
          }),
        },
      },
    });
  }

  for (const [index, collection] of collections.entries()) {
    const linked = docs.filter(
      (d) => (collection.tag && d.tags.some((t) => t.slug === collection.tag)) || collection.docs?.includes(d.titleRu),
    );
    const cover = linked.find((d) => imageOf(d));
    await db.collection.create({
      data: {
        slug: collection.slug,
        theme: collection.theme,
        sortOrder: index + 1,
        titleKz: collection.title.kz,
        titleRu: collection.title.ru,
        titleEn: collection.title.en,
        descriptionKz: collection.description.kz,
        descriptionRu: collection.description.ru,
        descriptionEn: collection.description.en,
        periodLabelKz: collection.period?.kz,
        periodLabelRu: collection.period?.ru,
        periodLabelEn: collection.period?.en,
        sourceNoteKz: "ШҚО мемлекеттік архивінің тақырыптық топтамасы (e-arhiv.vko.gov.kz)",
        sourceNoteRu: "Тематическая коллекция Госархива ВКО (e-arhiv.vko.gov.kz)",
        sourceNoteEn: "Thematic collection of the East Kazakhstan State Archive (e-arhiv.vko.gov.kz)",
        coverUrl: cover ? imageOf(cover) : null,
        status: "PUBLISHED",
        isDemo: true,
        documents: { connect: linked.map((d) => ({ id: d.id })) },
      },
    });
  }

  for (const event of events) {
    const linked = docs.filter((d) => (event.tag && d.tags.some((t) => t.slug === event.tag)) || event.docs?.includes(d.titleRu));
    await db.historicalEvent.create({
      data: {
        year: event.year,
        theme: event.theme,
        titleKz: event.title.kz,
        titleRu: event.title.ru,
        titleEn: event.title.en,
        descriptionKz: event.description?.kz,
        descriptionRu: event.description?.ru,
        descriptionEn: event.description?.en,
        sourceNoteKz: event.theme === "archive" ? "«Архив тарихы», e-arhiv.vko.gov.kz" : null,
        sourceNoteRu: event.theme === "archive" ? "«История архива», e-arhiv.vko.gov.kz" : null,
        sourceNoteEn: event.theme === "archive" ? "“History of the archive”, e-arhiv.vko.gov.kz" : null,
        status: "PUBLISHED",
        isDemo: false,
        documents: { connect: linked.slice(0, 8).map((d) => ({ id: d.id })) },
      },
    });
  }

  for (const person of persons) {
    const fund = person.fund ? await db.fund.findFirst({ where: { number: person.fund }, select: { id: true } }) : null;
    const linked = person.fund ? docs.filter((d) => d.storageUnit.inventory.fund.number === person.fund) : [];
    await db.historicalPerson.create({
      data: {
        slug: person.slug,
        nameKz: person.name.kz,
        nameRu: person.name.ru,
        nameEn: person.name.en,
        bioKz: person.bio.kz,
        bioRu: person.bio.ru,
        bioEn: person.bio.en,
        fundId: fund?.id,
        status: "PUBLISHED",
        isDemo: false,
        documents: { connect: linked.map((d) => ({ id: d.id })) },
      },
    });
  }

  return { exhibitions: exhibitions.length, collections: collections.length, events: events.length, persons: persons.length };
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed-memory.ts")) {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? LOCAL_DB;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  seedMemory(db)
    .then((c) => console.log(`✅ Выставок: ${c.exhibitions}, коллекций: ${c.collections}, событий: ${c.events}, личностей: ${c.persons}`))
    .catch((error) => {
      console.error("❌ Ошибка загрузки «Архива памяти»:", error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
