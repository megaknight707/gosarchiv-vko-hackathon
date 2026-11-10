// Новый временный пароль сотруднику админки (если пароли из сида потерялись).
//   npm run staff:password -- archivist@gosarchiv.demo          (локальная база)
//   npm run prod:staff:password -- archivist@gosarchiv.demo     (Supabase)
//   npm run staff:password -- --all                              (всем демо-сотрудникам)
// Пароль печатается один раз в консоль; в базе хранится только bcrypt-хэш. Не сохраняйте вывод в git.
import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const connectionString = process.env.DATABASE_URL ?? "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

function generatePassword() {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(14), (byte) => alphabet[byte % alphabet.length]).join("");
}

async function main() {
  const arg = process.argv[2];
  if (!arg) throw new Error("Укажите e-mail сотрудника или --all");
  const users = arg === "--all"
    ? await db.user.findMany({ where: { email: { endsWith: "@gosarchiv.demo" } }, orderBy: { email: "asc" } })
    : await db.user.findMany({ where: { email: arg.toLowerCase() } });
  if (!users.length) throw new Error(`Сотрудник не найден: ${arg}`);

  const rows: { email: string; role: string; password: string }[] = [];
  for (const user of users) {
    const password = generatePassword();
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(password, 12), failedLoginCount: 0, lockedUntil: null, isActive: true },
    });
    rows.push({ email: user.email, role: user.role, password });
  }
  console.log("🔑 Новые временные пароли (НЕ сохраняйте в git):");
  console.table(rows);
}

main()
  .catch((error) => {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
