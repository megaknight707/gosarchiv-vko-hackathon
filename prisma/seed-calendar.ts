// Загрузка «Календаря памятных дат» (официальные файлы архива за 2022–2026 годы, KZ и RU).
//   npm run seed:calendar       — локально
//   npm run prod:seed:calendar  — на продакшен-базу
// Данные: prisma/demo-data/memorable-dates.json (собраны из docx архива, строки RU и KZ сопоставлены по порядку).
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import memorableDates from "./demo-data/memorable-dates.json";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const LOCAL_DB = "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";

export async function seedCalendar(db: PrismaClient) {
  await db.memorableDate.deleteMany();
  const { count } = await db.memorableDate.createMany({
    data: memorableDates.map((d) => ({ ...d, status: "PUBLISHED" as const })),
  });
  return count;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed-calendar.ts")) {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? LOCAL_DB;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  seedCalendar(db)
    .then((count) => console.log(`✅ Памятных дат: ${count}`))
    .catch((error) => {
      console.error("❌ Ошибка загрузки календаря:", error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
