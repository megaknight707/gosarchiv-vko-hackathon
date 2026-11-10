// Загрузка сгенерированных демо-сканов в Supabase Storage (bucket «archive-media»).
//   npm run scans            — сначала сгенерировать файлы локально
//   npm run scans:upload     — затем загрузить их в Supabase
// Нужны переменные SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (в .env.local или в окружении).
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const SOURCE_DIR = path.join(process.cwd(), "public", "uploads", "demo");
const CONCURRENCY = 8;

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full) : Promise.resolve([full]);
    }),
  );
  return nested.flat();
}

async function main() {
  // Импорт после загрузки .env, чтобы драйвер увидел ключи
  const { getStorage } = await import("../lib/storage");
  const storage = getStorage("supabase");

  const files = (await listFiles(SOURCE_DIR)).filter((file) => file.endsWith(".webp"));
  if (files.length === 0) {
    console.log("Файлов нет. Сначала выполните: npm run scans");
    return;
  }

  let done = 0;
  const queue = [...files];
  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift()!;
      const key = path.relative(path.join(process.cwd(), "public", "uploads"), file).split(path.sep).join("/");
      await storage.saveFile(key, await fs.readFile(file), "image/webp");
      done++;
      if (done % 50 === 0) console.log(`  загружено ${done}/${files.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`✅ Загружено в Supabase Storage: ${done} файлов`);
}

main().catch((error) => {
  console.error("❌ Ошибка загрузки:", error);
  process.exitCode = 1;
});
