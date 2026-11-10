// Демо для негативного сценария «закрытый файл не выдаётся» (Дополнения к ТЗ §6):
// прикрепляет сгенерированный демо-скан к опубликованному документу с ограниченным доступом.
// Файл лежит в приватном хранилище; /api/files/{id} отдаёт его только сотруднику архива.
//   npm run seed:restricted          (локально)
//   npm run prod:seed:restricted     (Supabase)
import { config } from "dotenv";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { savePrivateFile } from "../lib/storage";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv" }),
});

const svg = (w: number, h: number) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#e9dfc9"/>
  <rect x="30" y="30" width="${w - 60}" height="${h - 60}" fill="none" stroke="#8a5a12" stroke-width="8"/>
  <text x="50%" y="45%" text-anchor="middle" font-family="serif" font-size="${w / 9}" font-weight="700" fill="#6b6257">ДЕМО</text>
  <text x="50%" y="58%" text-anchor="middle" font-family="sans-serif" font-size="${w / 26}" fill="#8a5a12">ОГРАНИЧЕННЫЙ ДОСТУП · тестовый скан</text>
</svg>`);

async function main() {
  const doc = await db.archiveDocument.findFirst({
    where: { accessStatus: "RESTRICTED", status: "PUBLISHED", isDemo: true },
    orderBy: { cipher: "asc" },
    include: { files: true },
  });
  if (!doc) throw new Error("Нет опубликованного демо-документа с ограниченным доступом");
  if (doc.files.length) {
    console.log(`ℹ️  У документа «${doc.titleRu}» уже есть файлы (${doc.files.length}) — пропускаем`);
    return;
  }

  const original = await sharp(svg(1400, 1000)).png().toBuffer();
  const view = await sharp(original).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const thumb = await sharp(original).resize({ width: 320 }).webp({ quality: 70 }).toBuffer();
  const base = `documents/${doc.id}/restricted-demo`;
  const [viewKey, previewKey, originalKey] = await Promise.all([
    savePrivateFile(`${base}.webp`, view.data, "image/webp"),
    savePrivateFile(`${base}-thumb.webp`, thumb, "image/webp"),
    savePrivateFile(`${base}-original.png`, original, "image/png"),
  ]);

  const file = await db.digitalFile.create({
    data: {
      documentId: doc.id,
      kind: "IMAGE",
      url: "",
      isPrivate: true,
      viewKey,
      previewKey,
      originalKey,
      checksum: createHash("sha256").update(original).digest("hex"),
      originalName: "restricted-demo.png",
      originalMime: "image/png",
      width: view.info.width,
      height: view.info.height,
      sizeBytes: view.data.length,
      mimeType: "image/webp",
      pageNumber: 1,
    },
  });
  await db.digitalFile.update({
    where: { id: file.id },
    data: { url: `/api/files/${file.id}?v=view`, previewUrl: `/api/files/${file.id}?v=thumb`, originalUrl: `/api/files/${file.id}?v=original` },
  });
  await db.archiveDocument.update({ where: { id: doc.id }, data: { hasDigitalCopy: true } });
  console.log(`✅ Демо-скан прикреплён к «${doc.titleRu}» (${doc.cipher}).`);
  console.log(`   Карточка: /ru/catalog/${doc.id}`);
  console.log(`   Файл (посетителю — 403): /api/files/${file.id}?v=view`);
}

main()
  .catch((error) => {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
