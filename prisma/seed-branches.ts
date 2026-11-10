// Обновление филиалов по реальным данным архива без пересоздания базы:
// существующие обновляются по slug, новые добавляются, отсутствующие в списке — удаляются
// (ссылки документов/новостей на них становятся пустыми, сами записи не удаляются).
//   npm run seed:branches       — локально
//   npm run prod:seed:branches  — на продакшен-базу (после npm run prod:migrate)
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { branches } from "./demo-data/branches";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const LOCAL_DB = "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";

export async function seedBranches(db: PrismaClient) {
  for (const branch of branches) {
    const { slug, ...data } = branch;
    await db.branch.upsert({ where: { slug }, create: branch, update: data });
  }
  const removed = await db.branch.deleteMany({ where: { slug: { notIn: branches.map((b) => b.slug) } } });
  return { upserted: branches.length, removed: removed.count };
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed-branches.ts")) {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? LOCAL_DB;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  seedBranches(db)
    .then((r) => console.log(`✅ Филиалов обновлено/добавлено: ${r.upserted}, удалено устаревших: ${r.removed}`))
    .catch((error) => {
      console.error("❌ Ошибка обновления филиалов:", error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
