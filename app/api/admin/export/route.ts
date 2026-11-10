// Экспорт раздела админки в CSV (ТЗ §6.3) и шаблон для импорта.
// Только для вошедших сотрудников с правом просмотра раздела; администратор филиала
// получает только записи своего филиала.
import { branchScope, can } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { toCsv } from "@/lib/admin/csv";
import { importTemplate } from "@/lib/admin/document-import";
import { fieldColumns } from "@/lib/admin/entity-config";
import { getEntityConfig } from "@/lib/admin/entity-configs";
import { delegateFor } from "@/lib/admin/entity-service";
import { db } from "@/lib/db";

function csvResponse(body: string, name: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const entity = new URL(request.url).searchParams.get("entity") ?? "";
  const date = new Date().toISOString().slice(0, 10);

  if (entity === "import-template") {
    if (!can(user, "import", "create")) return new Response("Forbidden", { status: 403 });
    return csvResponse(importTemplate(), "import-documents-template.csv");
  }

  if (entity === "feedback") {
    if (!can(user, "feedback", "view")) return new Response("Forbidden", { status: 403 });
    const rows = await db.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
    const header = ["createdAt", "kind", "locale", "message", "name", "email", "isReviewed", "isPublished"];
    return csvResponse(toCsv(header, rows.map((r) => header.map((h) => r[h as keyof typeof r]))), `feedback-${date}.csv`);
  }

  const config = getEntityConfig(entity);
  if (!config) return new Response("Not found", { status: 404 });
  if (!can(user, config.key, "view")) return new Response("Forbidden", { status: 403 });

  const header = [
    "id",
    ...(config.key === "documents" ? ["cipher"] : []),
    ...config.fields.flatMap(fieldColumns),
    ...(config.moderated ? ["status"] : []),
    ...(config.demoFlag ? ["isDemo"] : []),
  ];
  const rows = await delegateFor(config).findMany({
    where: branchScope(user, config.key) ?? {},
    orderBy: { [config.defaultSort.field]: config.defaultSort.direction },
    take: 5000,
  });
  return csvResponse(toCsv(header, rows.map((row) => header.map((h) => row[h]))), `${config.key}-${date}.csv`);
}
