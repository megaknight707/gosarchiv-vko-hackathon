// Удалить мусорные запросы из статистики поиска (раздел «Аналитика» в админке).
//   npm run analytics:remove -- "запрос" ["ещё запрос" …]        (локальная база)
//   npm run prod:analytics:remove -- "запрос" ["ещё запрос" …]   (Supabase)
// Сравнение без учёта регистра и пробелов по краям — так же, как запросы группирует аналитика.
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const connectionString = process.env.DATABASE_URL ?? "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const queries = process.argv.slice(2).map((q) => q.trim().toLowerCase()).filter(Boolean);
  if (!queries.length) throw new Error('Укажите запрос: npm run analytics:remove -- "запрос"');
  for (const query of queries) {
    const removed = await db.$executeRaw`DELETE FROM "SearchLog" WHERE lower(trim("query")) = ${query}`;
    console.log(`«${query}»: удалено записей — ${removed}`);
  }
}

main()
  .catch((error) => {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
