// Блок раздела «Антикоррупционная комплаенс-служба»: комплаенс-офицер и официальные PDF архива.
import { FileText, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { COMPLIANCE_OFFICER, listComplianceDocuments } from "@/lib/site/compliance-documents";

const formatSize = (bytes: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "kz" ? "kk" : locale, { maximumFractionDigits: 1 }).format(bytes / 1_048_576);

export async function ComplianceDocuments({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Compliance" });
  const documents = listComplianceDocuments(locale);

  return (
    <div className="mt-6 max-w-3xl space-y-5">
      <p className="flex items-center gap-3 rounded-[14px] border border-border bg-surface p-4">
        <UserRound aria-hidden className="size-6 shrink-0 text-accent-2" />
        <span>
          <span className="block text-sm text-muted-ink">{t("officer")}</span>
          <b>{COMPLIANCE_OFFICER}</b>
        </span>
      </p>

      <div>
        <h3 className="mb-2 font-serif text-lg font-bold">{t("documents")}</h3>
        <ul className="divide-y divide-border rounded-[14px] border border-border bg-surface">
          {documents.map((doc) => (
            <li key={doc.key} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
              <FileText aria-hidden className="hidden size-5 shrink-0 text-primary sm:block" />
              <span className="flex-1">{doc.title}</span>
              <span className="flex shrink-0 gap-2">
                {doc.files.map((file) => (
                  <a
                    key={file.lang}
                    href={file.href}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-bold whitespace-nowrap hover:border-primary"
                  >
                    PDF · {t(`lang.${file.lang}`)}
                    <span className="font-mono text-xs font-normal text-muted-ink">
                      {t("sizeMb", { size: formatSize(file.sizeBytes, locale) })}
                    </span>
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>
        {locale === "en" && <p className="mt-2 text-sm text-muted-ink">{t("enNotice")}</p>}
      </div>
    </div>
  );
}
