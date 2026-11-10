// Загрузка реестра фондов Госархива ВКО (реальные данные на 2018 год, 1 667 фондов).
//   npm run seed:funds       — локально
//   npm run prod:seed:funds  — на продакшен-базу
// Источник: таблицы .xlsb со старого сайта e-arhiv.vko.gov.kz (раздел «Фонды»), собраны в
// prisma/demo-data/fund-registry.json. Сведения о секретных фондах в перечень не включены.
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import fundRegistry from "./demo-data/fund-registry.json";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const LOCAL_DB = "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";

export async function seedFundRegistry(db: PrismaClient) {
  await db.fundRegistryEntry.deleteMany();
  let count = 0;
  // Пачками — чтобы не упираться в лимит параметров одного запроса
  for (let i = 0; i < fundRegistry.length; i += 500) {
    const batch = fundRegistry.slice(i, i + 500);
    const result = await db.fundRegistryEntry.createMany({ data: batch.map((f) => ({ ...f, sourceYear: 2018 })) });
    count += result.count;
  }
  return count;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed-fund-registry.ts")) {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? LOCAL_DB;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  seedFundRegistry(db)
    .then((count) => console.log(`✅ Фондов в реестре: ${count}`))
    .catch((error) => {
      console.error("❌ Ошибка загрузки реестра фондов:", error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
