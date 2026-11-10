"use server";

// Импорт CSV в два шага: «Проверить» (предпросмотр и отчёт об ошибках) → «Импортировать».
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/require-role";
import { writeAuditLog } from "./audit-log";
import { checkImport, runImport, type ImportIssue, type ImportRow } from "./document-import";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export type ImportState = {
  step?: "preview" | "done";
  csv?: string;
  fileName?: string;
  total?: number;
  preview?: ImportRow[];
  validCount?: number;
  issues?: ImportIssue[];
  headerError?: string;
  imported?: number;
  error?: "noFile" | "tooBig" | "forbidden";
};

export async function importDocumentsAction(prev: ImportState, formData: FormData): Promise<ImportState> {
  let user;
  try {
    user = await requireAdminAction("import", "create");
  } catch {
    return { error: "forbidden" };
  }

  // Шаг 2: импорт уже проверенного текста (проверяем ещё раз — данные с клиента)
  if (formData.get("step") === "import") {
    const csv = String(formData.get("csv") ?? "");
    if (csv.length > MAX_FILE_BYTES) return { error: "tooBig" };
    const check = await checkImport(csv);
    const imported = await runImport(check.rows, formData.get("isDemo") === "on");
    await writeAuditLog({
      userId: user.id,
      action: "import",
      entityType: "documents",
      details: { file: String(formData.get("fileName") ?? "").slice(0, 120), imported, skipped: check.total - imported },
    });
    revalidatePath("/[locale]/admin/documents", "page");
    return { step: "done", imported, total: check.total, issues: check.issues };
  }

  // Шаг 1: проверка файла
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "noFile" };
  if (file.size > MAX_FILE_BYTES) return { error: "tooBig" };
  const csv = await file.text();
  const check = await checkImport(csv);
  return {
    step: "preview",
    csv,
    fileName: file.name,
    total: check.total,
    preview: check.rows.slice(0, 30),
    validCount: check.rows.length,
    issues: check.issues.slice(0, 200),
    headerError: check.headerError,
  };
}
