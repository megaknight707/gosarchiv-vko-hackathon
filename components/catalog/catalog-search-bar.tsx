"use client";

// Строка поиска каталога + «Расширенный поиск» (автор, № фонда / описи / дела).
// Обычная GET-форма: выбранные фильтры передаются скрытыми полями и сохраняются.
import Form from "next/form";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CatalogFilters } from "@/lib/search/catalog-filters";

const CARRIED: (keyof CatalogFilters)[] = ["type", "place", "topic", "branch", "access", "from", "to", "digital", "sort"];

export function CatalogSearchBar({ filters }: { filters: CatalogFilters }) {
  const t = useTranslations("Catalog");
  const locale = useLocale();
  const hasAdvanced = Boolean(filters.author || filters.fund || filters.inv || filters.unit);
  const [advancedOpen, setAdvancedOpen] = useState(hasAdvanced);

  const field = "h-11 w-full rounded-lg border border-border bg-bg px-3 text-ink placeholder:text-muted-ink";

  return (
    <Form action={`/${locale}/catalog`} role="search" className="rounded-[14px] border border-border bg-surface p-2 shadow-[0_1px_2px_rgba(60,40,20,.06)]">
      {CARRIED.map((key) => {
        const value = filters[key];
        if (value == null || (Array.isArray(value) && value.length === 0)) return null;
        return <input key={key} type="hidden" name={key} value={Array.isArray(value) ? value.join(",") : String(value)} />;
      })}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2 px-2">
          <Search aria-hidden className="size-4 shrink-0 text-muted-ink" />
          <span className="sr-only">{t("searchLabel")}</span>
          <input
            name="q"
            type="search"
            defaultValue={filters.q ?? ""}
            maxLength={200}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-muted-ink"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            aria-expanded={advancedOpen}
            aria-controls="advanced-search"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-4 font-bold whitespace-nowrap hover:bg-chip sm:flex-none"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            {advancedOpen ? t("advancedHide") : t("advanced")}
          </button>
          <button type="submit" className="h-11 flex-1 rounded-[10px] bg-primary px-5 font-bold text-primary-foreground hover:opacity-90 sm:flex-none">
            {t("submit")}
          </button>
        </div>
      </div>
      {advancedOpen && (
        <div id="advanced-search" className="mt-2 grid gap-3 border-t border-border p-2 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm sm:col-span-2 lg:col-span-1">
            <span className="mb-1 block text-muted-ink">{t("author")}</span>
            <input name="author" defaultValue={filters.author ?? ""} maxLength={100} className={field} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-ink">{t("fundNumber")}</span>
            <input name="fund" defaultValue={filters.fund ?? ""} maxLength={20} className={`${field} font-mono`} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-ink">{t("invNumber")}</span>
            <input name="inv" inputMode="numeric" defaultValue={filters.inv ?? ""} maxLength={20} className={`${field} font-mono`} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-ink">{t("unitNumber")}</span>
            <input name="unit" inputMode="numeric" defaultValue={filters.unit ?? ""} maxLength={20} className={`${field} font-mono`} />
          </label>
        </div>
      )}
    </Form>
  );
}
