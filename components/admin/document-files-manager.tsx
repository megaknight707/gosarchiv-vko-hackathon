"use client";

// Цифровые копии документа: пакетная загрузка (файлы отправляются по одному, виден прогресс
// и ошибка по каждому файлу), порядок страниц перетаскиванием или кнопками ↑ ↓, удаление.
// Проверка формата, сигнатуры и размера, сжатие в WebP — на сервере.
import { ArrowDown, ArrowUp, FileText, GripVertical, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteDocumentFileAction, reorderDocumentFilesAction, uploadDocumentFileAction } from "@/lib/admin/entity-actions";
import { MAX_UPLOAD_BYTES } from "@/lib/admin/file-signature";
import { loose } from "@/lib/admin/loose-translator";

type FileItem = { id: string; kind: string; url: string; previewUrl: string | null; pageNumber: number; sizeBytes: number | null };
type Progress = { name: string; status: "waiting" | "uploading" | "done" | "error"; error?: string };

export function DocumentFilesManager({ documentId, files, canEdit }: { documentId: string; files: FileItem[]; canEdit: boolean }) {
  const t = loose(useTranslations("Admin.files"));
  const router = useRouter();
  const [order, setOrder] = useState(files);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // После загрузки сервер присылает новый список файлов — обновляем порядок,
  // не теряя сообщения о загрузке (рекомендованный React способ вместо useEffect)
  const [serverFiles, setServerFiles] = useState(files);
  if (files !== serverFiles) {
    setServerFiles(files);
    setOrder(files);
  }

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    const queue = Array.from(list).slice(0, 50);
    setProgress(queue.map((f) => ({ name: f.name, status: "waiting" })));
    for (const [i, file] of queue.entries()) {
      const update = (patch: Partial<Progress>) => setProgress((p) => p.map((item, j) => (j === i ? { ...item, ...patch } : item)));
      if (file.size > MAX_UPLOAD_BYTES) {
        update({ status: "error", error: t("errors.tooLarge") });
        continue;
      }
      update({ status: "uploading" });
      const data = new FormData();
      data.set("file", file);
      try {
        const result = await uploadDocumentFileAction(documentId, data);
        update(result.ok ? { status: "done" } : { status: "error", error: t(`errors.${result.error}`) });
      } catch {
        update({ status: "error", error: t("errors.network") });
      }
    }
    router.refresh();
  }

  function saveOrder(next: FileItem[]) {
    setOrder(next);
    startTransition(async () => {
      const ok = await reorderDocumentFilesAction(documentId, next.map((f) => f.id));
      setMessage(ok ? t("orderSaved") : t("errors.order"));
      router.refresh();
    });
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    saveOrder(next);
  }

  function drop(targetId: string) {
    if (!dragged || dragged === targetId) return;
    const next = order.filter((f) => f.id !== dragged);
    const index = next.findIndex((f) => f.id === targetId);
    next.splice(index, 0, order.find((f) => f.id === dragged)!);
    setDragged(null);
    saveOrder(next);
  }

  function remove(fileId: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const ok = await deleteDocumentFileAction(documentId, fileId);
      setMessage(ok ? t("deleted") : t("errors.delete"));
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="files-title" className="rounded-[12px] border border-border bg-surface p-4">
      <h2 id="files-title" className="font-serif text-lg font-bold">
        {t("title")} <span className="text-sm font-normal text-muted-ink">({order.length})</span>
      </h2>
      <p className="mt-1 text-sm text-muted-ink">{t("hint")}</p>

      {canEdit && (
        <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-[12px] border-2 border-dashed border-border px-4 py-6 text-center text-sm hover:border-accent-2 hover:bg-accent-2-soft focus-within:border-accent-2">
          <Upload aria-hidden className="size-6 text-accent-2" />
          <span className="font-bold">{t("choose")}</span>
          <span className="text-xs text-muted-ink">{t("formats")}</span>
          <input
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp,image/tiff"
            className="sr-only"
            onChange={(event) => {
              void upload(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      )}

      {progress.length > 0 && (
        <ul aria-live="polite" className="mt-3 space-y-1 text-sm">
          {progress.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex flex-wrap gap-2">
              <span className="truncate font-mono text-xs">{item.name}</span>
              <span className={item.status === "error" ? "text-primary" : item.status === "done" ? "text-ok" : "text-muted-ink"}>
                {t(`status.${item.status}`)}
                {item.error ? `: ${item.error}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      {message && (
        <p role="status" className="mt-2 text-sm text-muted-ink">
          {message}
        </p>
      )}

      {order.length > 0 && (
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy={pending}>
          {order.map((file, index) => (
            <li
              key={file.id}
              draggable={canEdit}
              onDragStart={() => setDragged(file.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => drop(file.id)}
              className="flex gap-3 rounded-[10px] border border-border bg-bg p-2"
            >
              {canEdit && <GripVertical aria-hidden className="mt-1 size-4 shrink-0 cursor-grab text-muted-ink" />}
              {file.kind === "PDF" ? (
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="grid size-16 shrink-0 place-items-center rounded bg-chip">
                  <FileText aria-hidden className="size-6" />
                  <span className="sr-only">PDF</span>
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- миниатюра из хранилища
                <img src={file.previewUrl ?? file.url} alt="" className="size-16 shrink-0 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-bold">{t("page", { number: index + 1 })}</p>
                <p className="text-xs text-muted-ink">
                  {file.kind}
                  {file.sizeBytes ? ` · ${t("size", { kb: Math.round(file.sizeBytes / 1024) })}` : ""}
                </p>
                {canEdit && (
                  <div className="mt-1 flex gap-1">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || pending} aria-label={t("moveUp", { number: index + 1 })} className="rounded border border-border p-1 disabled:opacity-40">
                      <ArrowUp aria-hidden className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === order.length - 1 || pending} aria-label={t("moveDown", { number: index + 1 })} className="rounded border border-border p-1 disabled:opacity-40">
                      <ArrowDown aria-hidden className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => remove(file.id)} disabled={pending} aria-label={t("delete", { number: index + 1 })} className="rounded border border-primary/40 p-1 text-primary">
                      <Trash2 aria-hidden className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
