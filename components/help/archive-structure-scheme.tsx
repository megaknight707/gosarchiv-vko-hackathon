"use client";

// Интерактивная схема «Архив → Фонд → Опись → Дело → Документ»:
// нажатие на уровень показывает пояснение (вкладки с клавиатурной навигацией).
import { Archive, ChevronRight, FileText, Folder, FolderTree, ListOrdered } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const LEVELS = [
  { key: "archive", Icon: Archive },
  { key: "fund", Icon: FolderTree },
  { key: "inventory", Icon: ListOrdered },
  { key: "unit", Icon: Folder },
  { key: "document", Icon: FileText },
] as const;

export function ArchiveStructureScheme() {
  const t = useTranslations("Help");
  const [active, setActive] = useState(1);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (active + (event.key === "ArrowRight" ? 1 : -1) + LEVELS.length) % LEVELS.length;
    setActive(next);
    document.getElementById(`level-tab-${next}`)?.focus();
  }

  const level = LEVELS[active];
  return (
    <div>
      <p className="mb-3 text-sm text-muted-ink">{t("schemeHint")}</p>
      <div role="tablist" aria-label={t("schemeTitle")} onKeyDown={onKeyDown} className="flex flex-wrap items-center gap-1.5">
        {LEVELS.map(({ key, Icon }, index) => (
          <div key={key} className="flex items-center gap-1.5">
            <button
              id={`level-tab-${index}`}
              role="tab"
              type="button"
              aria-selected={index === active}
              aria-controls="level-panel"
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "inline-flex items-center gap-2 rounded-[12px] border-2 px-3 py-2.5 font-bold transition-colors",
                index === active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {t(`levels.${key}.title`)}
            </button>
            {index < LEVELS.length - 1 && <ChevronRight aria-hidden className="size-4 text-muted-ink" />}
          </div>
        ))}
      </div>
      <div id="level-panel" role="tabpanel" aria-labelledby={`level-tab-${active}`} className="mt-4 rounded-[14px] border border-border bg-surface p-5">
        <p className="flex items-start gap-3">
          <level.Icon aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
          <span className="leading-relaxed">{t(`levels.${level.key}.text`)}</span>
        </p>
      </div>
    </div>
  );
}
