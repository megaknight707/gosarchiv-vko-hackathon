// Проверка загружаемых файлов (ТЗ §7.3): тип определяется по сигнатуре — первым байтам файла,
// а не по имени или расширению. Файл «photo.jpg», внутри которого программа или HTML, не пройдёт.
// Разрешены PDF, JPG, PNG, WebP, TIFF размером до 20 МБ.

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type DetectedType = "application/pdf" | "image/jpeg" | "image/png" | "image/webp" | "image/tiff";

export function detectFileType(bytes: Uint8Array): DetectedType | null {
  const starts = (...sig: number[]) => sig.every((byte, i) => bytes[i] === byte);
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf"; // %PDF-
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "image/webp"; // RIFF....WEBP
  }
  if (starts(0x49, 0x49, 0x2a, 0x00) || starts(0x4d, 0x4d, 0x00, 0x2a)) return "image/tiff"; // II*. / MM.*
  return null;
}

/** Синонимы MIME, которые присылают разные браузеры и системы */
const MIME_ALIASES: Record<string, DetectedType> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/tif": "image/tiff",
  "image/x-tiff": "image/tiff",
};

export type FileCheck =
  | { ok: true; type: DetectedType }
  | { ok: false; reason: "empty" | "tooLarge" | "unsupported" | "mismatch" };

/**
 * Проверяет размер, сигнатуру и соответствие заявленного браузером MIME-типа содержимому.
 * @param allowed какие типы допустимы в этом месте (для обложек — только изображения)
 */
export function checkUpload(
  bytes: Uint8Array,
  declaredMime: string,
  allowed: readonly DetectedType[] = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/tiff"],
): FileCheck {
  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, reason: "tooLarge" };
  const detected = detectFileType(bytes);
  if (!detected || !allowed.includes(detected)) return { ok: false, reason: "unsupported" };
  const declared: string = MIME_ALIASES[declaredMime] ?? declaredMime;
  // Пустой тип бывает у TIFF в некоторых системах — тогда решает сигнатура
  if (declared && declared !== "application/octet-stream" && (declared as string) !== detected) return { ok: false, reason: "mismatch" };
  return { ok: true, type: detected };
}

export const IMAGE_TYPES: readonly DetectedType[] = ["image/jpeg", "image/png", "image/webp", "image/tiff"];

export const EXTENSIONS: Record<DetectedType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/tiff": "tif",
};
