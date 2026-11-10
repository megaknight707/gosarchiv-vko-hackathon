// Выдача цифровых копий с проверкой права доступа на сервере («Дополнения к ТЗ» §3.1):
// посетитель получает файл, только если документ опубликован и в открытом доступе.
// Черновики, «только описание» и «ограниченный доступ» — 403 даже по прямой ссылке.
// Сотрудник с правом просмотра каталога видит файлы любых документов (для проверки и модерации).
import { can } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { readPrivateFile } from "@/lib/storage";

const VARIANTS = { view: "viewKey", thumb: "previewKey", original: "originalKey" } as const;

function denied(status: 403 | 404, text: string) {
  return new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

export async function GET(request: Request, { params }: RouteContext<"/api/files/[id]">) {
  const { id } = await params;
  if (!/^[a-z0-9]{8,40}$/i.test(id)) return denied(404, "Not found");
  const variant = (new URL(request.url).searchParams.get("v") ?? "view") as keyof typeof VARIANTS;
  if (!(variant in VARIANTS)) return denied(404, "Not found");

  const file = await db.digitalFile.findUnique({
    where: { id },
    include: { document: { select: { status: true, accessStatus: true } } },
  });
  if (!file) return denied(404, "Not found");

  const isPublic = file.document.status === "PUBLISHED" && file.document.accessStatus === "OPEN";
  if (!isPublic) {
    const user = await getCurrentUser();
    if (!user || !can(user, "documents", "view")) {
      return denied(403, "Доступ к файлу ограничен. Описание документа доступно в каталоге; порядок работы с документами — в читальном зале архива.");
    }
  }

  const key = file[VARIANTS[variant]];
  if (!file.isPrivate || !key) {
    // Старые демо-сканы лежат в публичном хранилище — просто перенаправляем
    const legacy = variant === "thumb" ? file.previewUrl : variant === "original" ? file.originalUrl : file.url;
    return legacy && !legacy.startsWith("/api/files/") ? Response.redirect(new URL(legacy, request.url), 302) : denied(404, "Not found");
  }

  const cache = isPublic ? "public, max-age=300" : "private, no-store";
  const stored = await readPrivateFile(key).catch((error) => {
    console.error("[files] не удалось прочитать файл:", error instanceof Error ? error.message : error);
    return null;
  });
  if (!stored) return denied(404, "Not found");
  if ("signedUrl" in stored) {
    return new Response(null, { status: 302, headers: { Location: stored.signedUrl, "Cache-Control": cache } });
  }
  const type = variant === "original" ? (file.originalMime ?? "application/octet-stream") : variant === "thumb" ? "image/webp" : file.mimeType;
  return new Response(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(stored.data.length),
      "Cache-Control": cache,
      "X-Content-Type-Options": "nosniff",
      ...(isPublic ? {} : { "X-Robots-Tag": "noindex" }),
    },
  });
}
