"use client";

// На телефоне и планшете фильтры спрятаны в выезжающую снизу панель «Фильтры (N)».
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { CatalogFilters } from "@/lib/search/catalog-filters";
import type { CatalogFacets } from "@/lib/search/search-catalog";
import { CatalogFiltersPanel } from "./catalog-filters-panel";

function activeCount(filters: CatalogFilters): number {
  return (
    filters.type.length + filters.place.length + filters.topic.length + filters.branch.length + filters.access.length +
    (filters.from || filters.to ? 1 : 0) + (filters.digital ? 1 : 0)
  );
}

export function MobileFilters({ filters, facets, total }: { filters: CatalogFilters; facets: CatalogFacets; total: number }) {
  const t = useTranslations("Catalog");
  const count = activeCount(filters);

  return (
    <Sheet>
      <SheetTrigger className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-border bg-surface px-4 font-bold lg:hidden">
        <SlidersHorizontal aria-hidden className="size-4" />
        {count > 0 ? t("filtersCount", { count }) : t("filters")}
      </SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[85dvh] gap-0 rounded-t-2xl border-border bg-surface p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="font-serif text-lg font-bold">{t("filters")}</SheetTitle>
          <SheetClose aria-label={t("closeFilters")} className="grid size-9 place-items-center rounded-full hover:bg-chip">
            <X aria-hidden className="size-5" />
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">{t("filters")}</SheetDescription>
        <div className="overflow-y-auto px-5 py-4">
          <CatalogFiltersPanel filters={filters} facets={facets} idPrefix="m" />
        </div>
        <div className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetClose className="h-11 w-full rounded-[10px] bg-primary font-bold text-primary-foreground">
            {t("showResults", { count: total })}
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
