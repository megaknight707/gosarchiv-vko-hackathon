"use server";

// Server Actions универсального CRUD: сохранить, удалить, сменить статус, массовые действия,
// файлы документа. Каждое действие заново проверяет права на сервере (requireAdminAction),
// проверяет данные (zod) и пишет запись в журнал действий.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales, type Locale } from "@/i18n/routing";
import { formatCipher } from "@/lib/archive/cipher";
import { can, canOnRecord } from "@/lib/auth/permissions";
import { AdminAccessError, requireAdminAction } from "@/lib/auth/require-role";
import type { AdminUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Prisma, type PublicationStatus } from "@/lib/generated/prisma/client";
import { deleteFile, deletePrivateFile } from "@/lib/storage";
import { diffFields, writeAuditLog } from "./audit-log";
import type { EntityConfig } from "./entity-config";
import { getEntityConfig } from "./entity-configs";
import { parseEntityForm, type FieldError } from "./entity-form";
import { delegateFor, recordTitle } from "./entity-service";
import { TRANSITIONS, isTransitionAllowed, type TransitionOp } from "./moderation";
import { processUpload, type UploadError } from "./process-upload";

export type SaveState = {
  errors?: Record<string, FieldError>;
  raw?: Record<string, string>;
  formError?: "forbidden" | "notFound" | "unknown";
  savedAt?: number;
  version?: number;
};

const idSchema = z.string().regex(/^[a-z0-9]{8,40}$/i);
const localeSchema = z.enum(locales);

function configOrThrow(key: string): EntityConfig {
  const config = getEntityConfig(key);
  if (!config) throw new AdminAccessError("NOT_FOUND");
  return config;
}

/** Публичный сайт собирается заранее (ISR) — после публикации обновляем все страницы */
function refreshPublicSite() {
  revalidatePath("/", "layout");
}

/** Особая логика документа: шифр из фонда/описи/дела, филиал по умолчанию — филиал фонда */
async function applyDocumentHook(data: Record<string, unknown>) {
  const unitId = data.storageUnitId as string | undefined;
  if (!unitId) return false;
  const unit = await db.storageUnit.findUnique({ where: { id: unitId }, include: { inventory: { include: { fund: true } } } });
  if (!unit) return false;
  data.cipher = formatCipher({ fund: unit.inventory.fund.number, inventory: unit.inventory.number, unit: unit.number });
  if (!data.branchId) data.branchId = unit.inventory.fund.branchId;
  return true;
}

function uniqueTargets(error: unknown): string[] | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = (error.meta as { target?: string[] | string } | undefined)?.target;
    return Array.isArray(target) ? target : target ? [target] : ["slug"];
  }
  return null;
}

export async function saveEntityAction(key: string, id: string | null, locale: Locale, prev: SaveState, formData: FormData): Promise<SaveState> {
  const version = (prev.version ?? 0) + 1;
  let user: AdminUser;
  let config: EntityConfig;
  try {
    config = configOrThrow(key);
    if (id) idSchema.parse(id);
    localeSchema.parse(locale);
    user = await requireAdminAction(config.key, id ? "edit" : "create");
  } catch {
    return { formError: "forbidden", version };
  }

  const delegate = delegateFor(config);
  const existing = id ? await delegate.findUnique({ where: { id } }) : null;
  if (id && !existing) return { formError: "notFound", version };
  if (existing && !canOnRecord(user, config.key, "edit", existing)) return { formError: "forbidden", version };

  const parsed = parseEntityForm(config, formData);
  // Администратор филиала создаёт и меняет новости только своего филиала
  if (user.role === "BRANCH_ADMIN" && config.key === "news") parsed.data.branchId = user.branchId;
  if (config.hook === "document" && !parsed.errors.storageUnitId && !(await applyDocumentHook(parsed.data))) {
    parsed.errors.storageUnitId = "required";
  }
  if (Object.keys(parsed.errors).length) return { errors: parsed.errors, raw: parsed.raw, version };

  // Новые изображения (обложки, фото филиала): проверка сигнатуры и сжатие в WebP
  const uploaded: string[] = [];
  for (const [field, file] of Object.entries(parsed.files)) {
    const folderField = config.fields.find((f) => f.name === field);
    const folder = folderField?.type === "image" ? folderField.folder : "misc";
    const result = await processUpload(file, `media/${folder}`, { imagesOnly: true });
    if (!result.ok) return { errors: { [field]: "upload" }, raw: parsed.raw, version };
    parsed.data[field] = result.file.url;
    uploaded.push(field);
  }

  const tags = parsed.tagIds ? { tags: { set: parsed.tagIds.map((tagId) => ({ id: tagId })) } } : {};
  let saved: Record<string, unknown> & { id: string };
  try {
    saved = existing
      ? await delegate.update({ where: { id }, data: { ...parsed.data, ...tags } })
      : await delegate.create({
          data: { ...parsed.data, ...(config.moderated ? { status: "DRAFT" } : {}), ...(parsed.tagIds ? { tags: { connect: parsed.tagIds.map((tagId) => ({ id: tagId })) } } : {}) },
        });
  } catch (error) {
    const targets = uniqueTargets(error);
    if (targets) return { errors: Object.fromEntries(targets.map((t) => [t, "unique" as const])), raw: parsed.raw, version };
    console.error("[admin] ошибка сохранения:", error);
    return { formError: "unknown", raw: parsed.raw, version };
  }

  await writeAuditLog({
    userId: user.id,
    action: existing ? "update" : "create",
    entityType: config.key,
    entityId: saved.id,
    details: {
      title: recordTitle(config, saved, "ru"),
      ...(existing ? { changes: diffFields(existing, parsed.data) } : {}),
      ...(uploaded.length ? { uploaded } : {}),
    },
  });

  // Изменения в опубликованной записи или в филиале сразу видны на сайте
  if (!config.moderated || existing?.status === "PUBLISHED") refreshPublicSite();
  if (!existing) redirect(`/${locale}/admin/${config.key}/${saved.id}?created=1`);
  // Обновляем страницу формы — она покажет сохранённые данные (новые обложки, шифр)
  revalidatePath(`/${locale}/admin/${config.key}/${saved.id}`);
  return { savedAt: Date.now(), version };
}

async function hasChildren(config: EntityConfig, id: string) {
  if (config.key === "funds") return (await db.inventory.count({ where: { fundId: id } })) > 0;
  if (config.key === "inventories") return (await db.storageUnit.count({ where: { inventoryId: id } })) > 0;
  if (config.key === "units") return (await db.archiveDocument.count({ where: { storageUnitId: id } })) > 0;
  if (config.key === "exhibitions") return (await db.exhibit.count({ where: { exhibitionId: id } })) > 0;
  return false;
}

export async function deleteEntityAction(key: string, id: string, locale: Locale) {
  const config = configOrThrow(key);
  idSchema.parse(id);
  localeSchema.parse(locale);
  const user = await requireAdminAction(config.key, "delete");
  const delegate = delegateFor(config);
  const existing = await delegate.findUnique({ where: { id }, ...(config.key === "documents" ? { include: { files: true } } : {}) });
  if (!existing) redirect(`/${locale}/admin/${config.key}`);
  if (!canOnRecord(user, config.key, "delete", existing)) throw new AdminAccessError();
  // Фонд, опись или дело с вложенными записями не удаляем — иначе каскадом пропали бы документы
  if (await hasChildren(config, id)) redirect(`/${locale}/admin/${config.key}/${id}?deleteError=children`);

  await delegate.delete({ where: { id } });
  // Файлы сканов удаляем из хранилища (записи о них база удалила каскадом)
  for (const file of (existing.files as StoredFile[] | undefined) ?? []) {
    await removeStoredFiles(file);
  }
  await writeAuditLog({ userId: user.id, action: "delete", entityType: config.key, entityId: id, details: { title: recordTitle(config, existing, "ru") } });
  if (existing.status === "PUBLISHED" || !config.moderated) refreshPublicSite();
  redirect(`/${locale}/admin/${config.key}?deleted=1`);
}

// ───────────── Согласование ─────────────

async function applyTransition(config: EntityConfig, user: AdminUser, id: string, op: TransitionOp, comment: string) {
  const delegate = delegateFor(config);
  const record = await delegate.findUnique({ where: { id } });
  if (!record) return "notFound" as const;
  const status = record.status as PublicationStatus;
  const allowed = (action: Parameters<typeof can>[2]) => canOnRecord(user, config.key, action, { ...record, status: undefined });
  if (!isTransitionAllowed(op, status, allowed)) return "forbidden" as const;
  const transition = TRANSITIONS[op];
  if (transition.commentRequired && !comment) return "commentRequired" as const;

  const extra = op === "publish" && config.key === "news" && !record.publishedAt ? { publishedAt: new Date() } : {};
  await delegate.update({ where: { id }, data: { status: transition.to, ...extra } });
  await db.moderationComment.create({
    data: { entityType: config.key, entityId: id, authorId: user.id, fromStatus: status, toStatus: transition.to, text: comment },
  });
  await writeAuditLog({
    userId: user.id,
    action: "status_change",
    entityType: config.key,
    entityId: id,
    details: { title: recordTitle(config, record, "ru"), from: status, to: transition.to, ...(comment ? { comment } : {}) },
  });
  if (status === "PUBLISHED" || transition.to === "PUBLISHED") refreshPublicSite();
  // Карточка записи и очередь модерации в админке показывают новый статус
  revalidatePath("/[locale]/admin/[entity]/[id]", "page");
  revalidatePath("/[locale]/admin", "layout");
  return "ok" as const;
}

export type TransitionState = { result?: "ok" | "notFound" | "forbidden" | "commentRequired"; version?: number };

const transitionSchema = z.object({
  op: z.enum(Object.keys(TRANSITIONS) as [TransitionOp, ...TransitionOp[]]),
  comment: z.string().trim().max(2000),
});

export async function transitionAction(key: string, id: string, prev: TransitionState, formData: FormData): Promise<TransitionState> {
  const version = (prev.version ?? 0) + 1;
  try {
    const config = configOrThrow(key);
    idSchema.parse(id);
    const user = await requireAdminAction(config.key);
    const parsed = transitionSchema.safeParse({ op: formData.get("op"), comment: formData.get("comment") ?? "" });
    if (!parsed.success) return { result: "forbidden", version };
    return { result: await applyTransition(config, user, id, parsed.data.op, parsed.data.comment), version };
  } catch {
    return { result: "forbidden", version };
  }
}

const bulkSchema = z.object({
  op: z.enum(["submit", "approve", "publish", "archive", "delete"]),
  ids: z.array(z.string().regex(/^[a-z0-9]{8,40}$/i)).min(1).max(100),
});

/** Массовые действия из таблицы: отметить строки → «Отправить на проверку» / «Опубликовать» / … */
export async function bulkAction(key: string, locale: Locale, formData: FormData) {
  const config = configOrThrow(key);
  localeSchema.parse(locale);
  const user = await requireAdminAction(config.key);
  const parsed = bulkSchema.safeParse({ op: formData.get("bulk"), ids: formData.getAll("ids") });
  if (!parsed.success) redirect(`/${locale}/admin/${config.key}?bulk=none`);
  const { op, ids } = parsed.data;

  let done = 0;
  const delegate = delegateFor(config);
  for (const id of ids) {
    if (op === "delete") {
      const record = await delegate.findUnique({ where: { id } });
      if (!record || !canOnRecord(user, config.key, "delete", record) || (await hasChildren(config, id))) continue;
      await delegate.delete({ where: { id } });
      await writeAuditLog({ userId: user.id, action: "delete", entityType: config.key, entityId: id, details: { title: recordTitle(config, record, "ru"), bulk: true } });
      if (record.status === "PUBLISHED") refreshPublicSite();
      done++;
    } else if (config.moderated && (await applyTransition(config, user, id, op, "")) === "ok") {
      done++;
    }
  }
  redirect(`/${locale}/admin/${config.key}?bulk=${op}&done=${done}&skipped=${ids.length - done}`);
}

// ───────────── Цифровые копии документа ─────────────

type StoredFile = { url: string; previewUrl: string | null; originalUrl: string | null; isPrivate?: boolean; viewKey?: string | null; previewKey?: string | null; originalKey?: string | null };

async function removeStoredFiles(file: StoredFile) {
  // Приватные сканы — по ключам в хранилище
  if (file.isPrivate) {
    for (const key of new Set([file.viewKey, file.previewKey, file.originalKey])) {
      if (key) await deletePrivateFile(key).catch(() => {});
    }
    return;
  }
  // Публичные файлы удаляем только загруженные через админку (ключи «documents/…»), демо-сканы не трогаем
  for (const url of new Set([file.url, file.previewUrl, file.originalUrl])) {
    const key = url?.match(/(?:\/uploads\/|\/archive-media\/)(documents\/[\w/.-]+)$/)?.[1];
    if (key) await deleteFile(key).catch(() => {});
  }
}

async function documentForFiles(documentId: string) {
  idSchema.parse(documentId);
  const user = await requireAdminAction("documents", "edit");
  const doc = await db.archiveDocument.findUnique({ where: { id: documentId } });
  if (!doc || !canOnRecord(user, "documents", "edit", doc)) throw new AdminAccessError();
  return { user, doc };
}

export type UploadResult = { ok: true; id: string } | { ok: false; error: UploadError | "forbidden" };

/** Загрузка одного файла (клиент отправляет файлы пакета по очереди и показывает прогресс) */
export async function uploadDocumentFileAction(documentId: string, formData: FormData): Promise<UploadResult> {
  let ctx: Awaited<ReturnType<typeof documentForFiles>>;
  try {
    ctx = await documentForFiles(documentId);
  } catch {
    return { ok: false, error: "forbidden" };
  }
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "empty" };
  // Сканы документов — только в приватное хранилище: выдача через /api/files/{id} с проверкой прав
  const result = await processUpload(file, `documents/${documentId}`, { private: true });
  if (!result.ok) return result;

  const last = await db.digitalFile.aggregate({ where: { documentId }, _max: { pageNumber: true } });
  const isPdf = result.file.type === "application/pdf";
  const draft = await db.digitalFile.create({
    data: {
      documentId,
      kind: isPdf ? "PDF" : "IMAGE",
      url: "",
      isPrivate: true,
      viewKey: result.file.viewKey,
      previewKey: result.file.previewKey,
      originalKey: result.file.originalKey,
      checksum: result.file.checksum,
      originalName: file.name.slice(0, 200),
      originalMime: result.file.type,
      uploadedById: ctx.user.id,
      width: result.file.width,
      height: result.file.height,
      sizeBytes: result.file.sizeBytes,
      mimeType: isPdf ? "application/pdf" : "image/webp",
      pageNumber: (last._max.pageNumber ?? 0) + 1,
    },
  });
  const created = await db.digitalFile.update({
    where: { id: draft.id },
    data: {
      url: `/api/files/${draft.id}?v=view`,
      previewUrl: isPdf ? null : `/api/files/${draft.id}?v=thumb`,
      originalUrl: `/api/files/${draft.id}?v=original`,
    },
  });
  await db.archiveDocument.update({ where: { id: documentId }, data: { hasDigitalCopy: true } });
  await writeAuditLog({
    userId: ctx.user.id,
    action: "file_upload",
    entityType: "documents",
    entityId: documentId,
    details: { title: ctx.doc.titleRu, file: file.name.slice(0, 120), type: result.file.type, page: created.pageNumber, sha256: result.file.checksum },
  });
  if (ctx.doc.status === "PUBLISHED") refreshPublicSite();
  return { ok: true, id: created.id };
}

export async function deleteDocumentFileAction(documentId: string, fileId: string): Promise<boolean> {
  try {
    idSchema.parse(fileId);
    const { user, doc } = await documentForFiles(documentId);
    const file = await db.digitalFile.findFirst({ where: { id: fileId, documentId } });
    if (!file) return false;
    await db.digitalFile.delete({ where: { id: fileId } });
    await removeStoredFiles(file);
    // Перенумеровываем оставшиеся страницы по порядку
    const rest = await db.digitalFile.findMany({ where: { documentId }, orderBy: { pageNumber: "asc" } });
    await db.$transaction(rest.map((f, i) => db.digitalFile.update({ where: { id: f.id }, data: { pageNumber: i + 1 } })));
    await db.archiveDocument.update({ where: { id: documentId }, data: { hasDigitalCopy: rest.length > 0 } });
    await writeAuditLog({ userId: user.id, action: "file_delete", entityType: "documents", entityId: documentId, details: { title: doc.titleRu, page: file.pageNumber } });
    if (doc.status === "PUBLISHED") refreshPublicSite();
    return true;
  } catch {
    return false;
  }
}

export async function reorderDocumentFilesAction(documentId: string, fileIds: string[]): Promise<boolean> {
  try {
    const ids = z.array(idSchema).max(500).parse(fileIds);
    const { user, doc } = await documentForFiles(documentId);
    const files = await db.digitalFile.findMany({ where: { documentId }, select: { id: true } });
    const known = new Set(files.map((f) => f.id));
    if (ids.length !== known.size || !ids.every((fileId) => known.has(fileId))) return false;
    await db.$transaction(ids.map((fileId, i) => db.digitalFile.update({ where: { id: fileId }, data: { pageNumber: i + 1 } })));
    await writeAuditLog({ userId: user.id, action: "file_reorder", entityType: "documents", entityId: documentId, details: { title: doc.titleRu } });
    if (doc.status === "PUBLISHED") refreshPublicSite();
    return true;
  } catch {
    return false;
  }
}
