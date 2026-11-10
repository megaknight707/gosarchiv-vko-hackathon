"use client";

// Выбор сортировки результатов (меняет параметр ?sort= в адресе).
import { useTranslations } from "next-intl";
import { type CatalogFilters, type CatalogSort, SORTS } from "@/lib/search/catalog-filters";
import { useCatalogNavigation } from "./use-catalog-navigation";

export function CatalogSortSelect({ filters, effectiveSort }: { filters: CatalogFilters; effectiveSort: CatalogSort }) {
  const t = useTranslations("Catalog");
  const { apply } = useCatalogNavigation(filters);
  const options = filters.q ? SORTS : SORTS.filter((s) => s !== "relevance");

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-ink">
      {t("sortLabel")}:
      <select
        value={effectiveSort}
        onChange={(e) => apply({ sort: e.target.value as CatalogSort })}
        className="h-9 rounded-md border border-border bg-surface px-2 font-bold text-ink"
      >
        {options.map((sort) => (
          <option key={sort} value={sort}>
            {t(`sort.${sort}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
