// Единственный экземпляр Prisma Client на всё приложение.
// В режиме разработки Next.js перезагружает модули при каждом изменении кода —
// без сохранения в globalThis каждый раз создавалось бы новое подключение
// к базе, и соединения быстро бы закончились.
//
// Клиент создаётся лениво — при первом обращении к базе, а не при импорте.
// Поэтому `next build` проходит и без DATABASE_URL.
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const LOCAL_DB = "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ?? (process.env.NODE_ENV === "production" ? undefined : LOCAL_DB);
  if (!connectionString) {
    throw new Error("DATABASE_URL не задан. Добавьте его в переменные окружения.");
  }
  // DATABASE_URL — пул-соединение (Supabase Transaction pooler, порт 6543)
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
