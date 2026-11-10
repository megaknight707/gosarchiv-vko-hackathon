// Обработка загруженных файлов: проверка → облегчённые WebP-копии через sharp → хранилище.
// Оригинал (мастер-копия) сохраняется как есть, на сайте показывается лёгкая копия
// (до 2000 px по длинной стороне) и миниатюра 320 px для ленты.
// Сканы документов кладутся в приватное хранилище (private: true) — их выдаёт /api/files/{id}
// только тем, кому можно (опубликованный открытый документ или сотрудник архива).
// Обложки выставок, фото филиалов и т. п. — в публичное хранилище.
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import sharp from "sharp";
import { saveFile, savePrivateFile } from "@/lib/storage";
import { checkUpload, EXTENSIONS, IMAGE_TYPES, type DetectedType } from "./file-signature";

export type UploadError = "empty" | "tooLarge" | "unsupported" | "mismatch" | "broken";

export type ProcessedUpload = {
  type: DetectedType;
  /** Публичные адреса (для private — null: адрес /api/files/{id} назначается после записи в базу) */
  url: string | null;
  previewUrl: string | null;
  originalUrl: string | null;
  /** Ключи в приватном хранилище */
  viewKey: string | null;
  previewKey: string | null;
  originalKey: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  /** SHA-256 исходного файла — контроль целостности мастер-копии */
  checksum: string;
};

function fileKey(folder: string, suffix: string) {
  return `${folder}/${Date.now().toString(36)}-${randomBytes(4).toString("hex")}${suffix}`;
}

export async function processUpload(
  file: File,
  folder: string,
  options: { imagesOnly?: boolean; private?: boolean } = {},
): Promise<{ ok: true; file: ProcessedUpload } | { ok: false; error: UploadError }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkUpload(bytes, file.type, options.imagesOnly ? IMAGE_TYPES : undefined);
  if (!check.ok) return { ok: false, error: check.reason };
  const checksum = createHash("sha256").update(bytes).digest("hex");

  // Куда сохранять: публично — возвращаем URL, приватно — ключ
  const store = async (key: string, data: Uint8Array | Buffer, type: string) =>
    options.private ? { key: await savePrivateFile(key, data, type), url: null } : { key: null, url: await saveFile(key, data, type) };

  if (check.type === "application/pdf") {
    const saved = await store(fileKey(folder, ".pdf"), bytes, "application/pdf");
    return {
      ok: true,
      file: {
        type: check.type,
        url: saved.url,
        previewUrl: null,
        originalUrl: saved.url,
        viewKey: saved.key,
        previewKey: null,
        originalKey: saved.key,
        width: null,
        height: null,
        sizeBytes: bytes.length,
        checksum,
      },
    };
  }

  try {
    // rotate() — учитываем поворот из EXIF; для многостраничного TIFF берётся первая страница
    const image = sharp(bytes, { failOn: "error" }).rotate();
    const view = await image
      .clone()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const preview = await image.clone().resize({ width: 320, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();

    const base = fileKey(folder, "");
    const [viewSaved, previewSaved, originalSaved] = await Promise.all([
      store(`${base}.webp`, view.data, "image/webp"),
      store(`${base}-thumb.webp`, preview, "image/webp"),
      store(`${base}-original.${EXTENSIONS[check.type]}`, bytes, check.type),
    ]);
    return {
      ok: true,
      file: {
        type: check.type,
        url: viewSaved.url,
        previewUrl: previewSaved.url,
        originalUrl: originalSaved.url,
        viewKey: viewSaved.key,
        previewKey: previewSaved.key,
        originalKey: originalSaved.key,
        width: view.info.width,
        height: view.info.height,
        sizeBytes: view.data.length,
        checksum,
      },
    };
  } catch {
    return { ok: false, error: "broken" }; // сигнатура верная, но файл повреждён
  }
}
