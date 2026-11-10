// Обработка загруженных файлов: проверка → облегчённые WebP-копии через sharp → хранилище.
// Оригинал (мастер-копия) сохраняется как есть, на сайте показывается лёгкая копия
// (до 2000 px по длинной стороне) и миниатюра 320 px для ленты.
import "server-only";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { saveFile } from "@/lib/storage";
import { checkUpload, EXTENSIONS, IMAGE_TYPES, type DetectedType } from "./file-signature";

export type UploadError = "empty" | "tooLarge" | "unsupported" | "mismatch" | "broken";

export type ProcessedUpload = {
  type: DetectedType;
  url: string;
  previewUrl: string | null;
  originalUrl: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number;
};

function fileKey(folder: string, suffix: string) {
  return `${folder}/${Date.now().toString(36)}-${randomBytes(4).toString("hex")}${suffix}`;
}

export async function processUpload(
  file: File,
  folder: string,
  options: { imagesOnly?: boolean } = {},
): Promise<{ ok: true; file: ProcessedUpload } | { ok: false; error: UploadError }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkUpload(bytes, file.type, options.imagesOnly ? IMAGE_TYPES : undefined);
  if (!check.ok) return { ok: false, error: check.reason };

  if (check.type === "application/pdf") {
    const url = await saveFile(fileKey(folder, ".pdf"), bytes, "application/pdf");
    return { ok: true, file: { type: check.type, url, previewUrl: null, originalUrl: url, width: null, height: null, sizeBytes: bytes.length } };
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
    const [url, previewUrl, originalUrl] = await Promise.all([
      saveFile(`${base}.webp`, view.data, "image/webp"),
      saveFile(`${base}-thumb.webp`, preview, "image/webp"),
      saveFile(`${base}-original.${EXTENSIONS[check.type]}`, bytes, check.type),
    ]);
    return {
      ok: true,
      file: { type: check.type, url, previewUrl, originalUrl, width: view.info.width, height: view.info.height, sizeBytes: view.data.length },
    };
  } catch {
    return { ok: false, error: "broken" }; // сигнатура верная, но файл повреждён
  }
}
