// Загрузка информационных страниц и FAQ (без затрагивания каталога).
//   npm run seed:content       — локально
//   npm run prod:seed:content  — на продакшен-базу
// Страницы обновляются по slug (upsert), FAQ пересоздаётся целиком.
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { faq, pages } from "./demo-data/content";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const LOCAL_DB = "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";

export async function seedContent(db: PrismaClient) {
  for (const page of pages) {
    const data = {
      section: page.section,
      sortOrder: page.sortOrder,
      titleKz: page.title.kz,
      titleRu: page.title.ru,
      titleEn: page.title.en,
      bodyKz: page.body.kz,
      bodyRu: page.body.ru,
      bodyEn: page.body.en,
      status: "PUBLISHED" as const,
    };
    await db.page.upsert({ where: { slug: page.slug }, create: { slug: page.slug, ...data }, update: data });
  }
  await db.faqItem.deleteMany();
  await db.faqItem.createMany({
    data: faq.map((item, index) => ({
      order: index + 1,
      questionKz: item.question.kz,
      questionRu: item.question.ru,
      questionEn: item.question.en,
      answerKz: item.answer.kz,
      answerRu: item.answer.ru,
      answerEn: item.answer.en,
      topic: item.topic,
      status: "PUBLISHED" as const,
    })),
  });
  return { pages: pages.length, faq: faq.length };
}

// Запуск как отдельного скрипта
if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed-content.ts")) {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? LOCAL_DB;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  seedContent(db)
    .then((counts) => console.log(`✅ Страниц: ${counts.pages}, вопросов FAQ: ${counts.faq}`))
    .catch((error) => {
      console.error("❌ Ошибка загрузки контента:", error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
