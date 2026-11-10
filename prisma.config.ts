// Конфигурация Prisma CLI (миграции, Studio, сид).
// CLI нужна ПРЯМАЯ строка подключения (DIRECT_URL): миграции не работают через пулер.
// Приложение во время работы использует пул-соединение DATABASE_URL (см. lib/db.ts).
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js читает .env.local, Prisma — нет, поэтому подгружаем оба файла.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

// Локальная база из docker-compose.yml (не секрет, только для разработки)
const LOCAL_DB = "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? LOCAL_DB,
  },
});
