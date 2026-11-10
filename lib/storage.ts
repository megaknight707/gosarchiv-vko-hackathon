// Хранилище файлов (сканы, фото) с двумя драйверами:
//   local    — папка public/uploads/ (для разработки; файлы отдаёт сам Next.js)
//   supabase — Supabase Storage, bucket «archive-media» (для продакшена на Vercel,
//              где файловая система только для чтения)
// Драйвер выбирается переменной STORAGE_DRIVER. Остальной код вызывает только
// saveFile / getPublicUrl / deleteFile и не знает, где лежат файлы.
//
// Важно: модуль использует SUPABASE_SERVICE_ROLE_KEY — импортировать его можно
// только в серверном коде (Server Actions, Route Handlers, скрипты).
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = "archive-media";

export type StorageDriverName = "local" | "supabase";

export interface StorageDriver {
  /** Сохранить файл по ключу (например «demo/doc-001/p1.webp»). Возвращает публичный URL. */
  saveFile(key: string, data: Buffer | Uint8Array, contentType: string): Promise<string>;
  /** Публичный URL файла по ключу */
  getPublicUrl(key: string): string;
  deleteFile(key: string): Promise<void>;
}

/** Ключ файла: только латиница, цифры, «-», «_», «.», «/» — защита от выхода за пределы папки */
export function normalizeKey(key: string): string {
  const clean = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!/^[a-zA-Z0-9/_.-]+$/.test(clean) || clean.split("/").some((part) => part === ".." || part === "")) {
    throw new Error(`Недопустимый ключ файла: ${key}`);
  }
  return clean;
}

// ───────────── local ─────────────

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const localDriver: StorageDriver = {
  async saveFile(key, data) {
    const safeKey = normalizeKey(key);
    const filePath = path.join(UPLOADS_DIR, safeKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return this.getPublicUrl(safeKey);
  },
  getPublicUrl(key) {
    return `/uploads/${normalizeKey(key)}`;
  },
  async deleteFile(key) {
    await fs.rm(path.join(UPLOADS_DIR, normalizeKey(key)), { force: true });
  },
};

// ───────────── supabase ─────────────

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Для STORAGE_DRIVER=supabase нужны SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
  }
  supabaseClient ??= createClient(url, serviceKey, { auth: { persistSession: false } });
  return supabaseClient;
}

const supabaseDriver: StorageDriver = {
  async saveFile(key, data, contentType) {
    const safeKey = normalizeKey(key);
    const { error } = await getSupabase()
      .storage.from(STORAGE_BUCKET)
      .upload(safeKey, data, { contentType, upsert: true, cacheControl: "31536000" });
    if (error) throw new Error(`Supabase Storage: ${error.message}`);
    return this.getPublicUrl(safeKey);
  },
  getPublicUrl(key) {
    // Публичный URL строится без запроса к API: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{key}
    const base = process.env.SUPABASE_URL?.replace(/\/+$/, "");
    if (!base) throw new Error("SUPABASE_URL не задан");
    return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${normalizeKey(key)}`;
  },
  async deleteFile(key) {
    const { error } = await getSupabase().storage.from(STORAGE_BUCKET).remove([normalizeKey(key)]);
    if (error) throw new Error(`Supabase Storage: ${error.message}`);
  },
};

// ───────────── выбор драйвера ─────────────

export function getStorageDriverName(): StorageDriverName {
  return process.env.STORAGE_DRIVER === "supabase" ? "supabase" : "local";
}

export function getStorage(driver: StorageDriverName = getStorageDriverName()): StorageDriver {
  return driver === "supabase" ? supabaseDriver : localDriver;
}

export const saveFile: StorageDriver["saveFile"] = (key, data, contentType) =>
  getStorage().saveFile(key, data, contentType);
export const getPublicUrl: StorageDriver["getPublicUrl"] = (key) => getStorage().getPublicUrl(key);
export const deleteFile: StorageDriver["deleteFile"] = (key) => getStorage().deleteFile(key);
