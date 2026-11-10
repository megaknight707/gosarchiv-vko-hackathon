"use client";

// Мастер импорта CSV: выбрать файл → проверить (предпросмотр, отчёт по строкам) → импортировать.
import { FileUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { importDocumentsAction, type ImportState } from "@/lib/admin/import-actions";
import { Link } from "@/i18n/navigation";
import { loose } from "@/lib/admin/loose-translator";

export function ImportWizard({ demoDefault }: { demoDefault: boolean }) {
  const t = loose(useTranslations("Admin.import"));
  const tf = loose(useTranslations("Admin.fields"));
  const [state, action, pending] = useActionState(importDocumentsAction, {} as ImportState);

  const issueText = (issue: { line: number; column: string; code: string }) =>
    t("issue", { line: issue.line, column: tf.has(issue.column) ? tf(issue.column) : issue.column, problem: t(`errors.${issue.code}`) });

  return (
    <div className="space-y-5">
      <form action={action} className="flex flex-wrap items-end gap-3 rounded-[12px] border border-border bg-surface p-4">
        <label className="block text-sm font-bold">
          {t("file")}
          <input type="file" name="file" accept=".csv,text/csv" required className="mt-1 block text-sm font-normal file:mr-3 file:rounded-lg file:border file:border-border file:bg-chip file:px-3 file:py-1.5 file:font-bold" />
        </label>
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-surface px-4 py-2 text-sm font-bold hover:bg-chip disabled:opacity-60">
          <FileUp aria-hidden className="size-4" />
          {pending ? t("checking") : t("check")}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {t(`errors.${state.error}`)}
        </p>
      )}

      {state.step === "preview" && (
        <section aria-live="polite" className="space-y-4">
          {state.headerError ? (
            <p role="alert" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              {state.headerError.startsWith("missing:") ? t("errors.missingColumns", { columns: state.headerError.slice(8) }) : t(`errors.${state.headerError}`)}
            </p>
          ) : (
            <>
              <p className="text-sm">
                {t("summary", { total: state.total ?? 0, valid: state.validCount ?? 0, invalid: (state.total ?? 0) - (state.validCount ?? 0) })}
              </p>
              {state.issues && state.issues.length > 0 && (
                <div className="rounded-[12px] border border-primary/40 bg-primary/5 p-4">
                  <h2 className="font-bold text-primary">{t("issuesTitle", { count: state.issues.length })}</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {state.issues.map((issue, i) => (
                      <li key={i}>{issueText(issue)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {state.preview && state.preview.length > 0 && (
                <div className="overflow-x-auto rounded-[12px] border border-border bg-surface">
                  <table className="w-full min-w-[640px] text-sm">
                    <caption className="px-3 py-2 text-left font-bold">{t("previewTitle")}</caption>
                    <thead className="border-y border-border bg-chip/60 text-left">
                      <tr>
                        <th scope="col" className="px-3 py-2">{t("line")}</th>
                        <th scope="col" className="px-3 py-2">{tf("cipher")}</th>
                        <th scope="col" className="px-3 py-2">{tf("title")}</th>
                        <th scope="col" className="px-3 py-2">{tf("docType")}</th>
                        <th scope="col" className="px-3 py-2">{tf("yearFrom")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.preview.map((row) => (
                        <tr key={row.line} className="border-b border-border last:border-0">
                          <td className="px-3 py-1.5 text-muted-ink">{row.line}</td>
                          <td className="px-3 py-1.5 font-mono text-xs">Ф. {row.fund} · Оп. {row.inventory} · Д. {row.unit}</td>
                          <td className="px-3 py-1.5">{row.titleRu}</td>
                          <td className="px-3 py-1.5">{row.docType}</td>
                          <td className="px-3 py-1.5">{row.yearFrom}{row.yearTo ? `–${row.yearTo}` : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {(state.validCount ?? 0) > 0 && (
                <form action={action} className="flex flex-wrap items-center gap-4">
                  <input type="hidden" name="step" value="import" />
                  <input type="hidden" name="fileName" value={state.fileName} />
                  <textarea name="csv" defaultValue={state.csv} hidden readOnly />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isDemo" defaultChecked={demoDefault} className="size-4" />
                    {t("isDemo")}
                  </label>
                  <button type="submit" disabled={pending} className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-60">
                    {t("run", { count: state.validCount ?? 0 })}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      )}

      {state.step === "done" && (
        <p role="status" className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">
          {t("done", { count: state.imported ?? 0 })}{" "}
          <Link href="/admin/documents?status=DRAFT" className="font-bold underline">
            {t("openDrafts")}
          </Link>
        </p>
      )}
    </div>
  );
}
